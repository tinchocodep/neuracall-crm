// INSTRUCCIONES PARA LIMPIAR EL STORAGE DEL NAVEGADOR
// Ejecutá esto en la consola del navegador (F12 → Console)

console.log('🧹 Limpiando storage del navegador...');

// Limpiar localStorage
localStorage.clear();
console.log('✅ localStorage limpiado');

// Limpiar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpiado');

// Limpiar cookies de Supabase
document.cookie.split(";").forEach(function (c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('✅ Cookies limpiadas');

console.log('🎉 Storage limpiado completamente. Recargá la página (Ctrl+R)');
