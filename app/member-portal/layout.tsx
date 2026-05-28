import MemberSidebar from "./components/MemberSidebar";

export default function MemberPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f4f0" }}>
      <MemberSidebar />
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}