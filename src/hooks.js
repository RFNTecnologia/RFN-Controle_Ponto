import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : inicial;
    } catch {
      return inicial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(valor));
  }, [key, valor]);
  return [valor, setValor];
}

export function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [erro, setErro] = useState(null);

  const solicitar = useCallback(() => {
    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada');
      return;
    }
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => setErro(e.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { pos, erro, solicitar };
}

export function useCamera(videoRef, onCapture) {
  const [stream, setStream] = useState(null);
  const [erro, setErro] = useState(null);

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      setErro('Não foi possível acessar a câmera');
    }
  }, [videoRef]);

  const parar = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capturar = useCallback(() => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.7);
    if (onCapture) onCapture(base64);
    return base64;
  }, [videoRef, onCapture]);

  useEffect(() => () => parar(), [parar]);

  return { stream, erro, iniciar, parar, capturar };
}
