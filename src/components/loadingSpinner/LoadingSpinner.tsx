// src/components/LoadingSpinner.tsx

const LoadingSpinner = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      {/* Puedes usar un spinner de carga de una librería o uno simple con CSS */}
      <div style={{
        border: '4px solid rgba(0, 0, 0, .1)',
        borderLeftColor: '#3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
      }}></div>
      <p style={{ marginTop: '10px' }}>Cargando...</p>
      
      {/* Animación CSS para el spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;