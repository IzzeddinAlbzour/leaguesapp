'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './icon';
import { useMaydan } from './context';

const playerNav = [ ['home','Overview','الرئيسية','/'], ['trophy','Leagues','الدوريات','/hub/leagues'], ['calendar','Matches','المباريات','/hub/matches'], ['users','My team','فريقي','/hub/team'], ['search','Discover','اكتشف','/hub/discover'], ['chart','Rankings','التصنيفات','/hub/rankings'], ['pin','Venues','الملاعب','/hub/venues'] ];
const adminNav = [ ['home','Operations','العمليات','/hub/admin'], ['trophy','Leagues','الدوريات','/hub/admin/leagues'], ['calendar','Scheduling','الجدولة','/hub/admin/schedule'], ['flag','Results & disputes','النتائج والنزاعات','/hub/admin/results'], ['users','People & teams','الأشخاص والفرق','/hub/admin/people'], ['wallet','Finance','المالية','/hub/admin/finance'], ['settings','Configuration','الإعدادات','/hub/admin/settings'] ];
const venueNav = [ ['home','Venue overview','نظرة عامة','/hub/owner'], ['calendar','Bookings','الحجوزات','/hub/owner/bookings'], ['clock','Availability','الأوقات المتاحة','/hub/owner/availability'], ['chart','Revenue','الإيرادات','/hub/owner/revenue'], ['pin','Venue details','تفاصيل الملعب','/hub/owner/settings'] ];
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const { t, locale, setLocale, state } = useMaydan(); const [menu, setMenu] = useState(false); const [query, setQuery] = useState('');
  const role = pathname.startsWith('/hub/admin') ? 'admin' : pathname.startsWith('/hub/owner') ? 'owner' : 'player';
  const nav = role === 'admin' ? adminNav : role === 'owner' ? venueNav : playerNav;
  const active = (href: string) => href === '/' || href === '/hub/admin' || href === '/hub/owner' ? pathname === href : pathname.startsWith(href);
  return <div className="maydan" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
    <a href="#main-content" className="md-skip">{t('Skip to content', 'انتقل إلى المحتوى')}</a>
    {menu && <button className="md-nav-scrim" onClick={() => setMenu(false)} aria-label={t('Close navigation', 'إغلاق القائمة')}/>}
    <aside className={`md-sidebar ${menu ? 'open' : ''}`}>
      <Link href="/" className="md-brand" aria-label="Maydan home"><span className="md-brand-mark">m<span>·</span></span><span>MAYDAN<small>YOUR GAME. YOUR GROUND.</small></span></Link>
      <div className="md-workspace"><span className="md-workspace-icon"><Icon name={role === 'owner' ? 'pin' : role === 'admin' ? 'shield' : 'ball'}/></span><div><b>{t('Your workspace', 'مساحتك')}</b><select aria-label={t('Choose workspace', 'اختر المساحة')} value={role} onChange={e => { router.push(e.target.value === 'admin' ? '/hub/admin' : e.target.value === 'owner' ? '/hub/owner' : '/'); setMenu(false); }}><option value="player">{t('Player & captain', 'لاعب وكابتن')}</option><option value="admin">{t('League organizer', 'منظّم الدوري')}</option><option value="owner">{t('Venue owner', 'صاحب ملعب')}</option></select></div></div>
      <span className="md-nav-label">{t(role === 'player' ? 'THE CLUBHOUSE' : 'MANAGEMENT', role === 'player' ? 'النادي' : 'الإدارة')}</span>
      <nav aria-label={t('Main navigation', 'القائمة الرئيسية')}>{nav.map(([icon,en,ar,href]) => <Link onClick={() => setMenu(false)} key={href} href={href} className={active(href) ? 'active' : ''} aria-current={active(href) ? 'page' : undefined}><Icon name={icon}/><span>{t(en,ar)}</span>{href === '/hub/team' && <span className="md-nav-counter">9</span>}</Link>)}</nav>
      <span className="md-nav-label">{t('PERSONAL', 'حسابي')}</span>
      <nav aria-label={t('Account navigation', 'قائمة الحساب')}>{[['wallet','Payments','المدفوعات','/hub/payments'],['settings','Settings','الإعدادات','/hub/settings']].map(([icon,en,ar,href]) => <Link onClick={() => setMenu(false)} key={href} href={href} className={active(href) ? 'active' : ''}><Icon name={icon}/><span>{t(en,ar)}</span>{icon === 'bell' && state.read.length < 3 && <i className="md-unread"/>}</Link>)}</nav>
      <div className="md-sidebar-bottom"><div className="md-season-note"><span className="md-tiny-ball">✳</span><b>{t('Made for our game.', 'منّا ولملعبنا.')}</b><p>{t('From the streets of Jenin. To your next great match.', 'من حارات جنين، لمباراتك الجايّة.')}</p><Link href="/hub/about">{t('The Maydan story', 'حكاية ميدان')} <Icon name="arrow" size={15}/></Link></div><Link className="md-account" href="/hub/profile"><span className="md-avatar">AD</span><span><b>{state.profile.name}</b><small>{t('Jenin United · Captain', 'جنين يونايتد · الكابتن')}</small></span><Icon name="down" size={16}/></Link></div>
    </aside>
    <div className="md-body"><header className="md-topbar"><div className="md-topbar-left"><button className="md-icon-button md-menu-toggle" onClick={() => setMenu(!menu)} aria-label={t('Open navigation', 'افتح القائمة')} aria-expanded={menu}><Icon name="menu"/></button><span className="md-location"><Icon name="pin" size={16}/>{t('Jenin, Palestine', 'جنين، فلسطين')}<span className="md-location-dot"/></span></div><div className="md-topbar-right"><form className="md-global-search" onSubmit={e => { e.preventDefault(); router.push(`/hub/discover?q=${encodeURIComponent(query)}`); }}><Icon name="search" size={17}/><input aria-label={t('Search teams and players', 'ابحث عن فرق ولاعبين')} placeholder={t('Find your next game...', 'دوّر على مباراتك الجايّة...')} value={query} onChange={e => setQuery(e.target.value)}/><kbd>↵</kbd></form><button className="md-language" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>{locale === 'en' ? 'العربية' : 'English'}</button><Link href="/hub/profile" aria-label={t('Your profile', 'ملفك')} className="md-avatar small">AD</Link></div></header>
      <main id="main-content" className="md-main">{children}</main>
      <footer className="md-footer"><span>© 2026 MAYDAN <span className="md-footer-dot">·</span> {t('Football belongs to everyone.', 'الكرة للجميع.')}</span><div><span className="md-preview-label">{t('Preview workspace · data saved on this device', 'مساحة تجريبية · البيانات محفوظة على جهازك')}</span><Link href="/login">{t('Sign in', 'تسجيل الدخول')}</Link><Link href="/hub/help">{t('Need a hand?', 'بدّك مساعدة؟')}</Link></div></footer>
    </div>
  </div>;
}

