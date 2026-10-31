#!/usr/bin/env python3
"""既存素材・制作予定を読み、目標値と5数字の重複を検査・予約する。"""
import argparse
from contextlib import contextmanager
import fcntl
import hashlib
import json
from pathlib import Path
import tempfile
import os


def identity(target, numbers):
    if type(target) is not int or not 10 <= target <= 99:
        raise ValueError('つくる数は10〜99の整数が必要')
    if not isinstance(numbers, list) or len(numbers) != 5 or any(
            type(n) is not int or not 1 <= n <= 10 for n in numbers):
        raise ValueError('元の数字は1〜10の整数5個が必要')
    return target, tuple(sorted(numbers))


def read(path):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError) as exc:
        raise ValueError(f'履歴を読めません: {path}: {exc}') from exc


def inventory(social):
    if not social.is_dir():
        raise ValueError(f'制作履歴のディレクトリがありません: {social}')
    records = {}

    ledger = social / 'problem-history.json'
    reserved = read(ledger) if ledger.exists() else {'version': 1, 'items': []}
    if not isinstance(reserved, dict) or reserved.get('version') != 1 or not isinstance(reserved.get('items'), list):
        raise ValueError(f'予約記録の形式が不明: {ledger}')

    def add(item, path):
        key = identity(item['target'], item['numbers'])
        records.setdefault(key, set()).add(str(path.relative_to(social)))

    for pattern in ['**/problems/*.json', '**/sources/*evidence.json']:
        for path in sorted(social.glob(pattern)):
            item = read(path)
            if not isinstance(item, dict):
                raise ValueError(f'問題の記録がオブジェクトではありません: {path}')
            if 'target' not in item or 'numbers' not in item:
                raise ValueError(f'目標値または元の5数字がない記録: {path}')
            add(item, path)

    for path in sorted(social.glob('**/batch-plan.json')):
        batch = read(path)
        if not isinstance(batch, dict):
            raise ValueError(f'制作計画がオブジェクトではありません: {path}')
        entries = [(f'{field}/{i}', item) for field in ['items', 'existingPublished']
                   for i, item in enumerate(batch.get(field, []))]
        for pointer, item in entries:
            if 'target' in item and 'numbers' in item:
                add(item, path)
            elif item.get('config'):
                config = read(path.parent / item['config'])
                if ('target' in item and item['target'] != config['target']) or (
                        item.get('variant') and item['variant'] != config.get('variant')):
                    raise ValueError(f'計画と参照先の問題が不一致: {path}, {pointer}')
                add(config, path)
            elif 'target' in item:
                # 目標値やvariantだけで別の問題を推定しない。
                digest = hashlib.sha256(json.dumps(item, sort_keys=True).encode()).hexdigest()
                matches = [b for b in reserved.get('bindings', [])
                           if b['path'] == str(path.relative_to(social)) and b['record'] == pointer
                           and b['recordSha256'] == digest and b['target'] == item['target']
                           and b.get('variant') == item.get('variant')]
                if len(matches) != 1:
                    raise ValueError(f'履歴の元の5数字との対応が未確認: {path}, {pointer}')
                add(matches[0], path)
            elif item.get('status') in ['ready', 'reserved', 'scheduled', 'published']:
                raise ValueError(f'実行予定/済み計画の問題設定が不足: {path}, {pointer}')

    for item in reserved['items']:
        add(item, ledger)
    if not records:
        raise ValueError('照合できる履歴が0件です。初回履歴の回収を先に行ってください')
    return records, reserved


@contextmanager
def locked(social):
    # repoにロックファイルを増やさず、同一端末の並行選定を直列化する。
    lock_id = hashlib.sha256(str(social.resolve()).encode()).hexdigest()
    with (Path(tempfile.gettempdir()) / f'jamaica-shorts-{lock_id}.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('command', choices=['inventory', 'sync', 'check', 'reserve'])
    default = next((p / 'ModernJamaica/appstore/social' for p in Path(__file__).resolve().parents
                    if (p / 'ModernJamaica/appstore/social').is_dir()), None)
    ap.add_argument('--social', type=Path, default=default)
    ap.add_argument('--target', type=int)
    ap.add_argument('--numbers', type=int, nargs=5)
    args = ap.parse_args(argv)
    try:
        if args.social is None:
            raise ValueError('--socialで実際の制作履歴を指定してください')
        social = args.social.resolve()
        if not social.is_dir():
            raise ValueError(f'制作履歴がありません: {social}')
        with locked(social):
            known, ledger = inventory(social)
            if args.command in ['inventory', 'sync']:
                result = {'scope': str(social), 'uniqueProblems': len(known),
                          'problems': [{'target': t, 'numbers': list(ns), 'sources': sorted(refs)}
                                       for (t, ns), refs in sorted(known.items())],
                          'limitation': 'ローカルの問題設定・収録記録・制作計画・予約を照合。プラットフォーム上だけの投稿は別途照合が必要'}
            else:
                key = identity(args.target, args.numbers)
                if key in known:
                    print(json.dumps({'duplicate': True, 'target': key[0], 'numbers': list(key[1]),
                                      'sources': sorted(known[key])}, ensure_ascii=False, indent=2))
                    return 1
                digest = hashlib.sha256(json.dumps(key).encode()).hexdigest()[:8]
                result = {'duplicate': False, 'target': key[0], 'numbers': list(key[1]),
                          'suggestedId': f'make-{key[0]}-{digest}', 'checkedProblems': len(known),
                          'reserved': args.command == 'reserve'}
                if args.command == 'reserve':
                    ledger['items'].append({'target': key[0], 'numbers': list(key[1]), 'id': result['suggestedId'], 'state': 'reserved', 'sources': []})
            if args.command == 'sync':
                previous = {identity(i['target'], i['numbers']): i for i in ledger['items']}
                ledger['items'] = [dict(target=t, numbers=list(ns),
                    state='observed' if refs - {'problem-history.json'} else previous.get((t, ns), {}).get('state', 'observed'),
                    sources=sorted((refs - {'problem-history.json'}) | set(previous.get((t, ns), {}).get('sources', []))))
                    for (t, ns), refs in sorted(known.items())]
            if args.command in ['reserve', 'sync']:
                with tempfile.NamedTemporaryFile(mode='w', dir=social, prefix='.problem-history-', delete=False) as tmp:
                    json.dump(ledger, tmp, ensure_ascii=False, indent=2)
                    temporary = Path(tmp.name)
                os.replace(temporary, social / 'problem-history.json')
            print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False))
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
