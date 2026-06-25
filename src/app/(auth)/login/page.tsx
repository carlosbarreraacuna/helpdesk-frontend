'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, TwoFactorRequired, TwoFactorSetupRequired } from '@/lib/auth-store';
import gsap from 'gsap';

const loginSchema = z.object({
  login:    z.string().min(1, 'El email o usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router      = useRouter();
  const loginFn     = useAuthStore(s => s.login);
  const currentUser = useAuthStore(s => s.user);
  const isAuth      = useAuthStore(s => s.isAuthenticated);

  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [remember,  setRemember]  = useState(false);

  const stageRef     = useRef<HTMLDivElement>(null);
  const mascotRef    = useRef<HTMLImageElement>(null);
  const brandMarkRef = useRef<HTMLDivElement>(null);
  const ulFxRef      = useRef<HTMLSpanElement>(null);
  const btnRef       = useRef<HTMLButtonElement>(null);
  const btnShineRef  = useRef<HTMLSpanElement>(null);
  const toastRef     = useRef<HTMLDivElement>(null);
  const toastMsgRef  = useRef<HTMLSpanElement>(null);

  /* redirect */
  useEffect(() => {
    if (isAuth && currentUser) {
      router.replace(currentUser.role?.name === 'usuario' ? '/portal/mis-tickets' : '/dashboard');
    }
  }, [isAuth, currentUser, router]);

  /* GSAP */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.al-top > *',  { y: -20, autoAlpha: 0 });
      gsap.set('.al-ey',       { x: -20, autoAlpha: 0 });
      gsap.set('.al-h1',       { y: 24,  autoAlpha: 0 });
      gsap.set('.al-lede',     { y: 18,  autoAlpha: 0 });
      gsap.set('.al-metric',   { y: 20,  autoAlpha: 0 });
      gsap.set('#al-mascot',   { scale: .85, autoAlpha: 0, y: 30 });
      gsap.set('.al-halo',     { scale: .6, autoAlpha: 0 });
      gsap.set('.al-ring',     { scale: .7, autoAlpha: 0, rotate: -30 });
      gsap.set('.al-foot',     { y: 20, autoAlpha: 0 });
      gsap.set('.ar-top > *',  { y: -14, autoAlpha: 0 });
      gsap.set('.ar-f',        { y: 16, autoAlpha: 0 });
      gsap.set('.ar-bot',      { y: 14, autoAlpha: 0 });
      if (ulFxRef.current) gsap.set(ulFxRef.current, { scaleX: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl
        .to('.al-top > *',  { y: 0, autoAlpha: 1, duration: .7, stagger: .08 }, 0)
        .to('.ar-top > *',  { y: 0, autoAlpha: 1, duration: .6, stagger: .08 }, .15)
        .to('.al-halo',     { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, .2)
        .to('.al-ring',     { scale: 1, autoAlpha: 1, rotate: 0, duration: 1.2, stagger: .08 }, .3)
        .to('#al-mascot',   { scale: 1, autoAlpha: 1, y: 0, duration: 1.0, ease: 'back.out(1.4)' }, .45)
        .to('.al-ey',       { x: 0, autoAlpha: 1, duration: .6 }, .55)
        .to('.al-h1',       { y: 0, autoAlpha: 1, duration: .85 }, .6)
        .to('.al-lede',     { y: 0, autoAlpha: 1, duration: .7 }, .85)
        .to('.al-metric',   { y: 0, autoAlpha: 1, duration: .6, stagger: .08 }, .95)
        .to('.ar-f',        { y: 0, autoAlpha: 1, duration: .6, stagger: .07 }, .55)
        .to('.al-foot',     { y: 0, autoAlpha: 1, duration: .6 }, 1.2)
        .to('.ar-bot',      { y: 0, autoAlpha: 1, duration: .6 }, 1.25);

      if (ulFxRef.current)
        tl.to(ulFxRef.current, { scaleX: 1, duration: .9, ease: 'power3.inOut' }, 1.05);

      // Counters
      document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
        const target = parseFloat(el.dataset.count!);
        const isFloat = !Number.isInteger(target);
        const uEl = el.querySelector('.u');
        const unit = uEl ? uEl.outerHTML : '';
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out', delay: 1.0,
          onUpdate() {
            el.innerHTML = (isFloat ? obj.v.toFixed(1) : Math.round(obj.v)) + unit;
          },
        });
      });

      // Mascot float
      gsap.to('#al-mascot', { y: '+=14', duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
      gsap.to('.al-halo',   { scale: 1.08, opacity: .85, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      document.querySelectorAll('.al-ring').forEach((el, i) =>
        gsap.to(el, { rotate: '+=360', duration: 30 + i * 8, repeat: -1, ease: 'none' })
      );

      // Brand pulse
      if (brandMarkRef.current)
        gsap.to(brandMarkRef.current, {
          boxShadow: '0 12px 30px rgba(90,169,51,.5), inset 0 0 0 1px rgba(255,255,255,.3)',
          duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
    });

    // Parallax tilt
    const stage = stageRef.current;
    const mascot = document.getElementById('al-mascot') as HTMLElement | null;
    if (stage && mascot) {
      const onMove = (e: MouseEvent) => {
        const r = stage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5;
        const ny = (e.clientY - r.top) / r.height - .5;
        gsap.to(mascot, { x: nx * 16, rotateY: nx * 10, rotateX: -ny * 8, duration: .9, ease: 'power2.out', transformPerspective: 900 });
      };
      const onLeave = () => gsap.to(mascot, { x: 0, rotateX: 0, rotateY: 0, duration: 1.2, ease: 'power3.out' });
      stage.addEventListener('mousemove', onMove);
      stage.addEventListener('mouseleave', onLeave);
      return () => {
        ctx.revert();
        stage.removeEventListener('mousemove', onMove);
        stage.removeEventListener('mouseleave', onLeave);
      };
    }
    return () => ctx.revert();
  }, []);

  /* Ctrl+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); showToast('Búsqueda global · Próximamente');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const showToast = (msg: string) => {
    if (toastMsgRef.current) toastMsgRef.current.textContent = msg;
    gsap.fromTo(toastRef.current, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45, ease: 'back.out(1.8)' });
    gsap.to(toastRef.current, { y: -40, autoAlpha: 0, duration: .4, ease: 'power2.in', delay: 2.4 });
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true); setError('');
    if (btnShineRef.current)
      gsap.fromTo(btnShineRef.current, { x: '-120%' }, { x: '120%', duration: .85, ease: 'power2.inOut' });
    try {
      await loginFn(data.login, data.password);
      const user = useAuthStore.getState().user;
      showToast('Acceso autorizado. Redirigiendo…');
      setTimeout(() => router.push(user?.role?.name === 'usuario' ? '/portal/mis-tickets' : '/dashboard'), 800);
    } catch (err: unknown) {
      if (err instanceof TwoFactorRequired) {
        showToast('Verificación en 2 pasos requerida…');
        setTimeout(() => router.push('/two-factor'), 700);
        return;
      }
      if (err instanceof TwoFactorSetupRequired) {
        showToast('Configura tu verificador en 2 pasos…');
        setTimeout(() => router.push('/two-factor/setup'), 700);
        return;
      }
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Credenciales incorrectas';
      setError(msg);
      gsap.fromTo(btnRef.current, { x: -8 }, { x: 0, duration: .55, ease: 'elastic.out(1.2,.35)' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .lp { font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
        .f-manrope { font-family:'Manrope',sans-serif; }
        .f-mono { font-family:'JetBrains Mono',monospace; }
        .grid-mesh {
          position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
          background-size:48px 48px;
          mask-image:radial-gradient(80% 70% at 30% 40%,#000 40%,transparent 85%);
          -webkit-mask-image:radial-gradient(80% 70% at 30% 40%,#000 40%,transparent 85%);
        }
        .grain { position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:3px 3px;mix-blend-mode:overlay;opacity:.4; }
        @keyframes pdot{0%,100%{box-shadow:0 0 0 0 rgba(135,197,74,.6)}50%{box-shadow:0 0 0 8px rgba(135,197,74,0)}}
        .pdot{animation:pdot 2s infinite;}
        @keyframes spin-s{to{transform:rotate(360deg)}}
        .spin-s{animation:spin-s .8s linear infinite;}
        .inp-wrap:focus-within{border-color:#5aa933!important;box-shadow:0 0 0 4px rgba(90,169,51,.12);}
        .inp-wrap:focus-within .inp-ico{color:#2f8a4e;}
        .inp-wrap input:focus{outline:none;}
        .btn-shine{position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%);transform:translateX(-120%);pointer-events:none;}
      `}</style>

      <div className="lp min-h-screen flex flex-col lg:flex-row bg-[#f6f7f3]">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div
          ref={stageRef}
          className="relative overflow-hidden flex flex-col justify-between text-[#eaf6e3] px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 lg:w-[55%] xl:w-[58%] min-h-[480px] lg:min-h-screen"
          style={{ background: 'radial-gradient(120% 80% at 20% 10%,#1f6b3f 0%,#16492f 35%,#0f3322 70%,#081c13 100%)' }}
        >
          <div className="grid-mesh" />
          <div className="grain" />

          {/* Header */}
          <header className="al-top relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div ref={brandMarkRef} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl grid place-items-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#87c54a,#2f8a4e)', boxShadow: '0 8px 24px rgba(90,169,51,.35),inset 0 0 0 1px rgba(255,255,255,.2)' }}>
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path d="M7 22c0-6 5-11 11-11h7v4c0 5-4 9-9 9h-5l-4 4v-6z" fill="#fff"/>
                  <circle cx="15" cy="17" r="1.6" fill="#1f6b3f"/>
                  <circle cx="20" cy="17" r="1.6" fill="#1f6b3f"/>
                </svg>
              </div>
              <div className="leading-none">
                <p className="f-manrope font-extrabold text-base sm:text-lg tracking-tight">Cardique</p>
                <p className="f-mono text-[10px] sm:text-[11px] text-[#a9c7b4] tracking-[.18em] uppercase mt-1">Mesa de Ayuda · TI</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 f-mono text-[10px] sm:text-[11px] tracking-[.1em] uppercase text-[#c3e28a] px-3 py-1.5 rounded-full border border-[rgba(195,226,138,.2)] bg-[rgba(255,255,255,.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#87c54a] pdot" />
              Sistemas operativos
            </div>
          </header>

          {/* Center — mascot + copy stacked on mobile, side by side on xl */}
          <div className="relative z-[2] flex-1 flex flex-col xl:grid xl:items-center xl:gap-6 py-6 sm:py-8"
            style={{ gridTemplateColumns: '1.1fr 1fr' }}>

            {/* Copy */}
            <div className="relative z-[4] order-2 xl:order-1 mt-4 xl:mt-0">
              <div className="al-ey f-mono text-[11px] text-[#c3e28a] tracking-[.2em] uppercase flex items-center gap-2.5 mb-4 sm:mb-5">
                <span className="w-5 h-px bg-[#c3e28a]" />
                Portal interno · v4.2
              </div>
              <h1 className="al-h1 f-manrope font-light text-[clamp(28px,4vw,56px)] leading-[1.04] tracking-[-0.03em] text-[#f4fbec] mb-4 sm:mb-5">
                Resolvemos lo<br className="hidden sm:block"/>que{' '}
                <strong className="font-bold text-white relative inline-block">
                  no deja trabajar
                  <span ref={ulFxRef} style={{ position:'absolute',left:0,bottom:'-2px',height:'5px',background:'#d7ff4d',borderRadius:'2px',transformOrigin:'left',width:'100%' }} />
                </strong>.
              </h1>
              <p className="al-lede text-sm sm:text-[15px] leading-[1.65] text-[#b9d2c2] max-w-[42ch] mb-6 sm:mb-8">
                Reporte incidencias, solicite servicios y siga el estado de sus tickets.
              </p>
              <div className="flex gap-5 sm:gap-7">
                {[
                  { count: '4.2', unit: 'min', label: 'Respuesta prom.' },
                  { count: '98',  unit: '%',   label: '1er nivel' },
                  { count: '247', unit: '',    label: 'Tickets / semana' },
                ].map(({ count, unit, label }) => (
                  <div key={label} className="al-metric flex flex-col gap-1">
                    <span className="f-manrope text-xl sm:text-[26px] font-bold text-white tracking-tight" data-count={count}>
                      0{unit && <span className="text-xs sm:text-sm text-[#87c54a] ml-0.5 u">{unit}</span>}
                    </span>
                    <span className="f-mono text-[9px] sm:text-[11px] text-[#8fa796] tracking-[.1em] uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mascot */}
            <div className="relative order-1 xl:order-2 mx-auto xl:ml-auto xl:mr-0 w-[220px] sm:w-[280px] md:w-[320px] xl:w-full xl:max-w-[420px] aspect-square grid place-items-center">
              <div className="al-halo absolute inset-[10%] rounded-full"
                style={{ background:'radial-gradient(circle,rgba(135,197,74,.3),transparent 65%)',filter:'blur(24px)' }} />
              <div className="al-ring absolute inset-[6%] rounded-full border border-dashed border-[rgba(195,226,138,.3)]" />
              <div className="al-ring absolute rounded-full border border-solid border-[rgba(135,197,74,.12)]" style={{ inset:'-2%' }} />
              <div className="al-ring absolute inset-[14%] rounded-full border border-dashed border-[rgba(195,226,138,.15)]" />

              {/* Mascot image — circular mask hides white bg corners */}
              <div className="relative z-[3] w-[145%]"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  id="al-mascot"
                  ref={mascotRef}
                  src="/mujer.png"
                  alt="Agente de soporte Cardique"
                  className="w-full h-auto"
                  style={{ willChange:'transform' }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="al-foot relative z-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8fa796]">
            <span className="hidden sm:block">Corp. Autónoma Regional del Canal del Dique · Cartagena de Indias</span>
            <span className="sm:hidden">CARDIQUE · Cartagena</span>
            <div className="hidden md:flex items-center gap-1">
              <kbd className="f-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[.06] border border-white/10 text-[#c3e28a]">Ctrl</kbd>
              <span>+</span>
              <kbd className="f-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[.06] border border-white/10 text-[#c3e28a]">K</kbd>
            </div>
          </footer>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div className="relative flex flex-col bg-[#f6f7f3] px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 lg:flex-1"
          style={{ backgroundImage:'radial-gradient(60% 40% at 100% 0%,rgba(90,169,51,.06),transparent 60%),radial-gradient(40% 30% at 0% 100%,rgba(90,169,51,.04),transparent 60%)' }}>

          {/* Panel top */}
          <div className="ar-top flex justify-between items-center mb-auto pb-6">
            <a href="/" className="inline-flex items-center gap-2 text-[13px] text-[#546860] px-3 py-2 rounded-xl hover:bg-[#ecefe7] hover:text-[#0a1713] transition-colors">
            </a>
           
          </div>

          {/* Form centered */}
          <div className="flex-1 flex items-center justify-center py-4">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[420px]" autoComplete="off">

              <h2 className="ar-f f-manrope font-bold text-[28px] sm:text-[34px] tracking-tight text-[#0a1713] mb-2">
                Bienvenido de nuevo.
              </h2>
              <p className="ar-f text-sm sm:text-[15px] leading-[1.55] text-[#546860] mb-7 sm:mb-9">
                Ingrese con su cuenta institucional para acceder al portal de soporte.
              </p>

              {/* Login */}
              <div className="ar-f mb-4">
                <label className="block text-[11px] sm:text-[12px] font-semibold text-[#1a2b23] tracking-[.04em] uppercase mb-2">
                  Correo institucional
                </label>
                <div className="inp-wrap flex items-center gap-2.5 bg-white border border-[#e3e7df] rounded-xl px-3.5 h-12 sm:h-[54px] transition-all duration-200">
                  <svg className="inp-ico w-4 h-4 text-[#9aa8a1] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                  <input type="text" placeholder="nombre.apellido@cardique.gov.co" {...register('login')}
                    className="flex-1 h-full text-sm sm:text-[15px] text-[#0a1713] placeholder-[#9aa8a1] bg-transparent" />
                </div>
                {errors.login && <p className="text-xs text-red-500 mt-1.5">{errors.login.message}</p>}
              </div>

              {/* Password */}
              <div className="ar-f mb-0">
                <label className="block text-[11px] sm:text-[12px] font-semibold text-[#1a2b23] tracking-[.04em] uppercase mb-2">
                  Contraseña
                </label>
                <div className="inp-wrap flex items-center gap-2.5 bg-white border border-[#e3e7df] rounded-xl px-3.5 h-12 sm:h-[54px] transition-all duration-200">
                  <svg className="inp-ico w-4 h-4 text-[#9aa8a1] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••••" {...register('password')}
                    className="flex-1 h-full text-sm sm:text-[15px] text-[#0a1713] placeholder-[#9aa8a1] bg-transparent" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="p-1.5 rounded-lg text-[#9aa8a1] hover:bg-[#f0f3eb] hover:text-[#1a2b23] transition-colors">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {showPass
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Remember + forgot */}
              <div className="ar-f flex justify-between items-center my-4 sm:my-5">
                
                <a href="#" className="text-[13px] text-[#1f6b3f] font-medium hover:underline">¿Olvidó su contraseña?</a>
              </div>

              {/* Error */}
              {error && (
                <div className="ar-f mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
              )}

              {/* Submit */}
              <button ref={btnRef} type="submit" disabled={isLoading}
                className="ar-f relative w-full h-12 sm:h-[54px] rounded-xl text-white f-manrope font-semibold text-sm sm:text-[15px] flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-200 hover:-translate-y-px disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#2f8a4e 0%,#1f6b3f 100%)', boxShadow:'0 10px 24px rgba(31,107,63,.28),inset 0 1px 0 rgba(255,255,255,.15)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 16px 32px rgba(31,107,63,.35),inset 0 1px 0 rgba(255,255,255,.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 10px 24px rgba(31,107,63,.28),inset 0 1px 0 rgba(255,255,255,.15)'; }}
              >
                <span ref={btnShineRef} className="btn-shine" />
                {isLoading
                  ? <span className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white spin-s" />
                  : <>
                      <span>Ingresar al portal</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                }
              </button>
            </form>
          </div>

          {/* Panel bottom */}
          <div className="ar-bot flex flex-wrap justify-between items-center gap-2 text-[11px] sm:text-xs text-[#546860] pt-4 border-t border-[#e3e7df]">
            <span>© 2026 Cardique — Oficina de TIC</span>
            <span className="f-mono hidden sm:block">Soporte: <strong className="text-[#0a1713]">ext. 108</strong> · ti@cardique.gov.co</span>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div ref={toastRef} className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#0a1713] text-white px-4 py-3 rounded-xl text-[13px] flex items-center gap-2.5 z-50 whitespace-nowrap"
        style={{ boxShadow:'0 20px 40px rgba(0,0,0,.25)', opacity:0 }}>
        <span className="w-2 h-2 rounded-full bg-[#87c54a]" />
        <span ref={toastMsgRef}>Acceso autorizado. Redirigiendo…</span>
      </div>
    </>
  );
}
