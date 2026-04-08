"use client"
import Link from "next/link"
import { usePathname }  from "next/navigation";
import { MessageSquare, LayoutDashboard, Users } from "lucide-react"

export default function Sidebar() {
  const path = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients",   label: "Clients",   icon: Users },
    { href: "/chat",      label: "AI Chat",      icon: MessageSquare },
  ]

  return (
    <aside style={{
      width: "220px", flexShrink: 0, background: "#fafaf9",
      borderRight: "0.5px solid #e8e8e6", display: "flex",
      flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0
    }}>
      <div style={{ padding: "20px", borderBottom: "0.5px solid #e8e8e6" }}>
        <div style={{ fontSize: "15px", fontWeight: "500", letterSpacing: "-0.3px" }}>DS Technologies</div>
        <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>Agent Dashboard</div>
      </div>

      <nav style={{ padding: "12px", flex: 1 }}>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", marginBottom: "2px",
            fontSize: "13px", textDecoration: "none",
            background: path === href ? "#fff" : "transparent",
            border: path === href ? "0.5px solid #e8e8e6" : "0.5px solid transparent",
            color: path === href ? "#1a1a1a" : "#888",
            fontWeight: path === href ? "500" : "400",
          }}>
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "0.5px solid #e8e8e6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "#e8f0fe", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "11px", fontWeight: "500", color: "#3b5bdb"
          }}>CB</div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "500" }}>Bassam</div>
            <div style={{ fontSize: "10px", color: "#999" }}>Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}