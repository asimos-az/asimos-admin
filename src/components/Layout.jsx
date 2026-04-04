import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Search,
  Tags,
  Users,
  X,
  FileText,
  MessageSquare,
  Bell,
} from 'lucide-react'
import { clearToken } from '../lib/auth'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `navItem ${isActive ? 'active' : ''}`}
    >
      <span className="navIcon"><Icon size={18} /></span>
      <span className="navLabel">{label}</span>
      <span className="navGlow" />
    </NavLink>
  )
}

export default function Layout({ title, children, subtitle }) {
  const nav = useNavigate()
  const loc = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
    const int = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(int)
  }, [])

  const loadUnreadCount = async () => {
    try {
      const { data } = await api.get('/me/notifications/unread-count')
      setUnreadCount(data?.unread || 0)
    } catch (e) {}
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://asimos-backend.onrender.com'

  const breadcrumb = useMemo(() => {
    const path = loc.pathname
    if (path === '/' || path === '') return 'İdarə paneli'
    return path.replace('/', '').replace(/\b\w/g, (c) => c.toUpperCase())
  }, [loc.pathname])

  const onLogout = () => {
    clearToken()
    nav('/login', { replace: true })
  }

  const closeDrawer = () => setDrawerOpen(false)

  const Sidebar = ({ mobile = false }) => (
    <aside className={mobile ? 'sidebar sidebarMobile' : 'sidebar'}>
      <div className="brand">
        <div className="brandMark">A</div>
        <div className="brandText">
          <div className="brandTitle">Asimos</div>
          <div className="brandSub">Admin Panel</div>
        </div>
      </div>

      <div className="sidebarSection">
        <div className="sidebarSectionTitle">Menyu</div>
        <nav className="nav">
          <NavItem to="/" icon={LayoutDashboard} label="İdarə paneli" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/users" icon={Users} label="İstifadəçilər" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/jobs" icon={Briefcase} label="Elanlar" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/categories" icon={Tags} label="Kateqoriyalar" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/content" icon={FileText} label="Qaydalar" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/support" icon={MessageSquare} label="Dəstək" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/map" icon={Map} label="Xəritə" onClick={mobile ? closeDrawer : undefined} />
          <NavItem to="/events" icon={Activity} label="Proseslər" onClick={mobile ? closeDrawer : undefined} />
        </nav>
      </div>

      <div className="sidebarSpacer" />

      <div className="sidebarFooter">
        <div className="footerMeta">
          <div className="footerLabel">Qoşulu</div>
          <div className="footerValue" title={baseUrl}>{baseUrl}</div>
        </div>
        <button className="btn danger full" onClick={onLogout}>
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
    </aside>
  )

  return (
    <div className="shell">
      <Sidebar />

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="drawerOverlay" onMouseDown={closeDrawer}>
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="drawerTop">
              <div className="drawerTitle">Menyu</div>
              <button className="iconBtn" onClick={closeDrawer} aria-label="Menyunu bağla">
                <X size={18} />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      ) : null}

      <main className="main">
        <div className="topbar">
          <div className="topbarLeft">
            <button className="iconBtn mobileOnly" onClick={() => setDrawerOpen(true)} aria-label="Menyunu aç">
              <Menu size={18} />
            </button>
            <div>
              <div className="pageTitle">{title || breadcrumb}</div>
              <div className="pageSub">{subtitle || 'İstifadəçiləri, elanları və proses loglarını idarə edin.'}</div>
            </div>
          </div>

          <div className="topbarRight">
            <div 
              className="iconBtn" 
              onClick={() => nav('/notifications')}
              style={{ position: 'relative', cursor: 'pointer', marginRight: 10 }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  border: '2px solid white'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="search">
              <Search size={16} />
              <input placeholder="Axtarış (tezliklə)…" disabled />
            </div>
            <div className="adminChip">
              <span className="adminDot" />
              <span>Super Admin</span>
            </div>
          </div>
        </div>

        <div className="content">{children}</div>
      </main>
    </div>
  )
}
