import ConnexionForm from "./ConnexionForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div
          className="brand"
          style={{ justifyContent: "center", paddingBottom: 22 }}
        >
          <div className="logo">B</div>
          <div>
            <div className="name">Ma Boutique</div>
            <div className="sub">Clinique St-Joseph</div>
          </div>
        </div>
        <ConnexionForm />
      </div>
    </div>
  );
}
