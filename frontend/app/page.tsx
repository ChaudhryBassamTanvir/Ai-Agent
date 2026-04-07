import Link from "next/link"

export default function Home() {
  return (
    <div style={{ 
      display: "flex", alignItems: "center", justifyContent: "center", 
      minHeight: "100vh", flexDirection: "column", gap: "24px" 
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "500", letterSpacing: "-0.5px" }}>
        AI Agent
      </h1>
      <p style={{ color: "#888", fontSize: "15px" }}>Client management powered by AI</p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link href="/chat" style={{
          padding: "10px 24px", background: "#1a1a1a", color: "#fff",
          borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "500"
        }}>Open Chat</Link>
        <Link href="/dashboard" style={{
          padding: "10px 24px", background: "#fff", color: "#1a1a1a",
          border: "0.5px solid #e0e0e0", borderRadius: "8px", 
          textDecoration: "none", fontSize: "14px"
        }}>Dashboard</Link>
      </div>
    </div>
  )
}