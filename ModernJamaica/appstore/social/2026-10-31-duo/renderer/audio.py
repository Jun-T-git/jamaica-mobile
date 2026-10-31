# Original restrained pluck score, composed here; no third-party music samples.
rate=48000
mix=np.zeros((round(DURATION*rate),2),dtype=np.float64)
rng=np.random.default_rng(1405)
def add(samples,at,gain=1,pan=0):
    pos=round(at*rate);n=min(len(samples),len(mix)-pos)
    if n<=0:return
    s=samples[:n]
    if s.ndim==1:s=np.column_stack((s*(1-pan*.3),s*(1+pan*.3)))
    mix[pos:pos+n]+=s*gain

def pluck(hz,length=.65):
    t=np.arange(round(length*rate))/rate
    env=(1-np.exp(-t*150))*np.exp(-t*7)
    return (np.sin(2*np.pi*hz*t)+.3*np.sin(2*np.pi*2*hz*t)+.1*np.sin(2*np.pi*3*hz*t))*env

melody=[76,None,79,83,81,None,79,74,76,None,79,86,83,None,81,79]
for i,at in enumerate(np.arange(0,DURATION,.3)):
    note=melody[i%len(melody)]
    if note is not None:add(pluck(440*2**((note-69)/12)),at,.085,(-1)**i*.6)
    if i%4==0:add(pluck(440*2**(([48,55,52,55][(i//8)%4]-69)/12),1.0),at,.1)
    if i%2==0:
        t=np.arange(2400)/rate
        add(rng.standard_normal(len(t))*np.exp(-t*100),at,.009)

def effect(name,at,gain):
    b=run(['-loglevel','error','-i',APP/'ios'/name,'-f','f32le','-ac',2,'-ar',rate,'-'])
    add(np.frombuffer(b,dtype='<f4').reshape(-1,2),at,gain)

# Observed source events mapped to the edited timeline; simulator source is silent.
events=[]
def event(name,raw,gain):
    offset=0
    for index,(a,b) in enumerate(CUTS):
        freeze=FREEZE_LENGTHS.get(index,0)
        if a<=raw<b:
            at=offset+raw-a+(freeze if raw>FREEZES.get(index,float('inf')) else 0);effect(name,at,gain);events.append({'file':name,'source':raw,'output':round(at,3)});return
        offset+=b-a+freeze
for item in CONFIG['effects']:event(item['file'],item['source'],item['gain'])
mix[:2400]*=np.linspace(0,1,2400)[:,None]
mix[-19200:]*=np.linspace(1,0,19200)[:,None]
peak=np.max(np.abs(mix))
if peak>.9:mix*=.9/peak
with wave.open(str(BUILD/'mix.wav'),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate)
    f.writeframes((mix*32767).astype('<i2').tobytes())
