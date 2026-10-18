"""Run the exact native comparator source against rollout build boundary cases."""
from pathlib import Path
import subprocess
import tempfile
root = Path(__file__).resolve().parents[1]
source = (root / 'ios/ModernJamaica/PurchaseModule.swift').read_text()
helper = source.split('// BEGIN MEASUREMENT BUILD COMPARATOR')[1].split('// END MEASUREMENT BUILD COMPARATOR')[0]
cases = [('2', '10', -1), ('10', '2', 1), ('1.10', '1.2', 1), ('1.0', '1', 0),
         ('00012.00', '12.0.0', 0), ('202610062250', '202610170001', -1),
         ('999999999999999999999999999', '2', 1), ('', '1', None), ('1..0', '1', None),
         ('1.0beta', '1', None), (' 1', '1', None), ('-1', '1', None), ('１', '1', None), ('1', '', None)]
checks = []
for a, b, expected in cases:
    value = 'nil' if expected is None else str(expected)
    checks.append(f'assert(compareMeasurementBuilds("{a}", "{b}") == {value})')
evidence_cases = [
    ('20', '20', '20', True, True, 'verified_new'),
    ('19', '20', '20', True, True, 'verified_existing'),
    ('21', '20', '20', True, True, 'unknown'),
    ('20', '19', '20', True, True, 'unknown'),
    ('20', '20', 'bad', True, True, 'unknown'),
    ('20', '20', '20', False, True, 'unknown'),
    ('20', '20', '20', True, False, 'unknown'),
    ('bad', '20', '20', True, True, 'unknown'),
]
for original, current, cutoff, production, bundle, expected in evidence_cases:
    checks.append(f'assert(classifyMeasurementInstall(original: "{original}", current: "{current}", cutoff: "{cutoff}", isProduction: {str(production).lower()}, bundleMatches: {str(bundle).lower()}) == "{expected}")')
with tempfile.TemporaryDirectory() as tmp:
    script = Path(tmp) / 'main.swift'
    gate = '\n#if DEBUG\nassert(!isMeasurementCollectionAllowed())\n#else\nassert(isMeasurementCollectionAllowed() == !ProcessInfo.processInfo.arguments.contains("--screenshots"))\n#endif\n'
    script.write_text('import Foundation\n' + helper + '\n' + '\n'.join(checks) + gate + '\nprint("Native comparator: 14 cases; native evidence classification: 8 cases passed")\n')
    sdk = subprocess.check_output(['xcrun', '--sdk', 'macosx', '--show-sdk-path'], text=True).strip()
    command = ['xcrun', 'swift', '-sdk', sdk, '-module-cache-path', str(Path(tmp) / 'cache')]
    subprocess.run(command + [str(script)], check=True)
    subprocess.run(command + ['-DDEBUG', str(script)], check=True)
    subprocess.run(command + [str(script), '--screenshots'], check=True)
    print('Native collection gates: release / DEBUG / screenshot passed')
