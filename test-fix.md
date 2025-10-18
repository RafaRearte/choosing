# Fixes Aplicados

## 1. ✅ Eliminado alert molesto de códigos
- Archivo: `organizador-crear-evento.html`
- Cambio: Removido el alert que mostraba los códigos al crear un evento
- Ahora simplemente redirige al dashboard

## 2. ✅ Arreglado Index.html (Acreditación)
- Archivo: `FrontEnd/js/core.js`
- Problema: No leía el eventId de la URL cuando hacías click en "Acreditar"
- Solución: Ahora lee el parámetro `?eventId=123` de la URL y lo guarda en localStorage

## 3. ℹ️ Sobre "evento test dashboard"
- NO es texto hardcodeado
- Es el nombre del evento que tienes guardado en localStorage de sesiones anteriores
- Para limpiarlo, abre la consola del navegador y ejecuta:
  ```javascript
  localStorage.removeItem('currentEventId');
  localStorage.removeItem('currentEventName');
  location.reload();
  ```

## Próximos Pasos
1. Reinicia el servidor con `dotnet run`
2. Limpia el localStorage (ver arriba)
3. Crea un nuevo evento con el nombre que quieras
4. Prueba hacer click en "Acreditar" - ahora debería funcionar
