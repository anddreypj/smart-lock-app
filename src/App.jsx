import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Componentes de UI
const Button = ({ onClick, disabled, variant = 'default', children, className = '' }) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

const Input = ({ type = 'text', placeholder, value, onChange, disabled = false }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="input"
  />
);

const Badge = ({ variant = 'default', children }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

const Alert = ({ type = 'info', children }) => (
  <div className={`alert alert-${type}`}>{children}</div>
);

// Componente Principal de la Aplicación
function SmartLockApp() {
  // Estados principales
  const [isLocked, setIsLocked] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [espIp, setEspIp] = useState('192.168.1.100');
  const [isListening, setIsListening] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('control');
  const [statusMessage, setStatusMessage] = useState('');
  const [accessLogs, setAccessLogs] = useState([
    { id: 1, time: '2024-01-15 10:30', user: 'Huella #1', method: 'Biométrico', success: true },
    { id: 2, time: '2024-01-15 14:22', user: 'Usuario Admin', method: 'Contraseña', success: true },
    { id: 3, time: '2024-01-15 18:45', user: 'Desconocido', method: 'Huella', success: false },
  ]);
  const [registeredFingerprints, setRegisteredFingerprints] = useState([
    { id: 1, name: 'Huella #1', date: '2024-01-10' },
    { id: 2, name: 'Huella #2', date: '2024-01-12' },
  ]);
  const [users, setUsers] = useState([
    { id: 1, name: 'Usuario Admin', role: 'Administrador' },
  ]);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [systemStatus, setSystemStatus] = useState('normal');
  const recognitionRef = useRef(null);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        processVoiceCommand(transcript.toLowerCase());
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setStatusMessage('Error en el reconocimiento de voz');
      };
    }
  }, []);

  // Función para procesar comandos de voz
  const processVoiceCommand = (command) => {
    if (command.includes('abrir') || command.includes('abre')) {
      handleUnlock('voz');
      setStatusMessage('Comando de voz: Abrir cerradura');
    } else if (command.includes('cerrar') || command.includes('cierra')) {
      handleLock('voz');
      setStatusMessage('Comando de voz: Cerrar cerradura');
    } else if (command.includes('estado')) {
      setStatusMessage(`Estado actual: ${isLocked ? 'CERRADO' : 'ABIERTO'}`);
    } else {
      setStatusMessage('Comando no reconocido. Intenta: "Abrir", "Cerrar" o "Estado"');
    }
  };

  // Función para iniciar reconocimiento de voz
  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // Función para conectar/desconectar del ESP32
  const toggleConnection = async () => {
    if (isConnected) {
      setIsConnected(false);
      setStatusMessage('Desconectado del ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/status`, {
        method: 'GET',
        mode: 'cors',
      });
      if (response.ok) {
        setIsConnected(true);
        setStatusMessage('Conectado al ESP32 exitosamente');
        fetchSystemStatus();
      } else {
        setStatusMessage('Error: No se puede conectar al ESP32');
      }
    } catch (error) {
      setStatusMessage(`Error de conexión: ${error.message}`);
    }
  };

  // Obtener estado del sistema
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`http://${espIp}/status`, {
        method: 'GET',
        mode: 'cors',
      });
      const data = await response.json();
      setIsLocked(data.locked);
      setBatteryLevel(data.battery || 85);
      setSystemStatus(data.status || 'normal');
    } catch (error) {
      console.error('Error obteniendo estado:', error);
    }
  };

  // Función para abrir la cerradura
  const handleUnlock = async (method = 'app') => {
    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/unlock`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (response.ok) {
        setIsLocked(false);
        setStatusMessage('Cerradura abierta exitosamente');
        addAccessLog('App Móvil', method, true);
      } else {
        setStatusMessage('Error al abrir la cerradura');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para cerrar la cerradura
  const handleLock = async (method = 'app') => {
    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/lock`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (response.ok) {
        setIsLocked(true);
        setStatusMessage('Cerradura cerrada exitosamente');
        addAccessLog('App Móvil', method, true);
      } else {
        setStatusMessage('Error al cerrar la cerradura');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para verificar contraseña
  const verifyPassword = async () => {
    if (!password) {
      setStatusMessage('Ingresa una contraseña');
      return;
    }

    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/verify-password`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (data.success) {
        setIsLocked(false);
        setPassword('');
        setStatusMessage('Contraseña correcta. Cerradura abierta.');
        addAccessLog('Contraseña', 'password', true);
      } else {
        setStatusMessage('Contraseña incorrecta');
        addAccessLog('Contraseña Incorrecta', 'password', false);
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para guardar nueva contraseña
  const saveNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setStatusMessage('Completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage('Las contraseñas no coinciden');
      return;
    }

    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/set-password`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        setStatusMessage('Contraseña guardada exitosamente');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage('Error al guardar la contraseña');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para registrar huella
  const registerFingerprint = async () => {
    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    setStatusMessage('Coloca tu dedo en el sensor...');

    try {
      const response = await fetch(`http://${espIp}/register-fingerprint`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        const newFingerprint = {
          id: registeredFingerprints.length + 1,
          name: `Huella #${registeredFingerprints.length + 1}`,
          date: new Date().toLocaleDateString(),
        };
        setRegisteredFingerprints([...registeredFingerprints, newFingerprint]);
        setStatusMessage('Huella registrada exitosamente');
      } else {
        setStatusMessage('Error al registrar la huella');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para eliminar huella
  const deleteFingerprint = async (id) => {
    if (!isConnected) {
      setStatusMessage('No conectado al ESP32');
      return;
    }

    try {
      const response = await fetch(`http://${espIp}/delete-fingerprint`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprintId: id }),
      });

      if (response.ok) {
        setRegisteredFingerprints(registeredFingerprints.filter(f => f.id !== id));
        setStatusMessage('Huella eliminada exitosamente');
      } else {
        setStatusMessage('Error al eliminar la huella');
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  // Función para agregar registro de acceso
  const addAccessLog = (user, method, success) => {
    const newLog = {
      id: accessLogs.length + 1,
      time: new Date().toLocaleString(),
      user,
      method,
      success,
    };
    setAccessLogs([newLog, ...accessLogs]);
  };

  // Renderizar contenido
  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <h1 className="app-title">🔐 Cerradura Inteligente</h1>
          <div className="header-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
            {isConnected && (
              <div className="battery-indicator">
                🔋 {batteryLevel}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estado de la Cerradura */}
      <Card className="lock-status-card">
        <div className="lock-status-content">
          <div className={`lock-icon ${isLocked ? 'locked' : 'unlocked'}`}>
            {isLocked ? '🔒' : '🔓'}
          </div>
          <div className="lock-info">
            <h2 className={`lock-state ${isLocked ? 'locked-text' : 'unlocked-text'}`}>
              {isLocked ? 'CERRADO' : 'ABIERTO'}
            </h2>
            <p className="lock-description">Estado actual de la cerradura</p>
          </div>
        </div>
      </Card>

      {/* Conexión */}
      <Card className="connection-card">
        <div className="connection-content">
          <div className="ip-input-group">
            <label>IP del ESP32:</label>
            <Input
              type="text"
              placeholder="192.168.1.100"
              value={espIp}
              onChange={(e) => setEspIp(e.target.value)}
              disabled={isConnected}
            />
          </div>
          <Button
            onClick={toggleConnection}
            variant={isConnected ? 'danger' : 'success'}
            className="connection-btn"
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </Card>

      {/* Mensaje de Estado */}
      {statusMessage && (
        <Alert type="info">
          {statusMessage}
        </Alert>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            Control
          </button>
          <button
            className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configurar
          </button>
          <button
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Historial
          </button>
        </div>

        {/* Tab: Control */}
        {activeTab === 'control' && (
          <div className="tab-content">
            <Card>
              <h3 className="card-title">Control de Acceso</h3>
              <div className="control-buttons">
                <Button
                  onClick={() => handleUnlock('app')}
                  disabled={!isConnected || !isLocked}
                  variant="primary"
                  className="control-btn"
                >
                  🔓 Abrir Cerradura
                </Button>
                <Button
                  onClick={() => handleLock('app')}
                  disabled={!isConnected || isLocked}
                  variant="secondary"
                  className="control-btn"
                >
                  🔒 Cerrar Cerradura
                </Button>
              </div>
            </Card>

            {/* Contraseña */}
            <Card>
              <h3 className="card-title">Acceso por Contraseña</h3>
              <div className="password-input-group">
                <Input
                  type="password"
                  placeholder="Ingrese contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isConnected}
                />
                <Button
                  onClick={verifyPassword}
                  disabled={!password || !isConnected}
                  variant="primary"
                >
                  Verificar
                </Button>
              </div>
            </Card>

            {/* Reconocimiento de Voz */}
            <Card>
              <h3 className="card-title">Control por Voz</h3>
              <Button
                onClick={startVoiceRecognition}
                disabled={isListening || !isConnected}
                variant={isListening ? 'danger' : 'primary'}
                className="voice-btn"
              >
                {isListening ? '🎤 Escuchando...' : '🎤 Comando de Voz'}
              </Button>
              {isListening && (
                <Alert type="info">
                  Diga: "Abrir cerradura", "Cerrar cerradura" o "Estado"
                </Alert>
              )}
            </Card>
          </div>
        )}

        {/* Tab: Configurar */}
        {activeTab === 'config' && (
          <div className="tab-content">
            {/* Gestión de Huellas */}
            <Card>
              <h3 className="card-title">Gestión de Huellas Dactilares</h3>
              <div className="fingerprint-list">
                {registeredFingerprints.map((fp) => (
                  <div key={fp.id} className="fingerprint-item">
                    <div className="fingerprint-info">
                      <p className="fingerprint-name">{fp.name}</p>
                      <p className="fingerprint-date">Registrada: {fp.date}</p>
                    </div>
                    <Button
                      onClick={() => deleteFingerprint(fp.id)}
                      disabled={!isConnected}
                      variant="danger"
                      className="delete-btn"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={registerFingerprint}
                disabled={!isConnected}
                variant="success"
                className="register-btn"
              >
                ➕ Registrar Nueva Huella
              </Button>
            </Card>

            {/* Gestión de Contraseñas */}
            <Card>
              <h3 className="card-title">Cambiar Contraseña</h3>
              <div className="password-form">
                <Input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!isConnected}
                />
                <Input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isConnected}
                />
                <Button
                  onClick={saveNewPassword}
                  disabled={!newPassword || !confirmPassword || !isConnected}
                  variant="primary"
                >
                  Guardar Contraseña
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Tab: Historial */}
        {activeTab === 'logs' && (
          <div className="tab-content">
            <Card>
              <h3 className="card-title">Registro de Accesos</h3>
              <div className="logs-list">
                {accessLogs.map((log) => (
                  <div key={log.id} className={`log-item ${log.success ? 'success' : 'failure'}`}>
                    <div className="log-info">
                      <p className="log-user">{log.user}</p>
                      <p className="log-time">{log.time}</p>
                      <p className="log-method">Método: {log.method}</p>
                    </div>
                    <Badge variant={log.success ? 'success' : 'danger'}>
                      {log.success ? '✓ Éxito' : '✗ Fallo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartLockApp;
