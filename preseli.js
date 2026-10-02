/* Parkiraj Osijek — stara adresa: prebacivanje na https://parkirajhr.com/osijek/ s prijenosom spremljenih postavki.
   Podaci idu u dijelu poveznice iza "#prenos=" (ne šalje se nijednom poslužitelju); nova adresa ih upisuje i briše iz adrese. */
(function(){
  var NEW="https://parkirajhr.com/osijek/";
  var KEYS=["os-car","os-vehicles","os-off","os-car-auto","os-zone","os-theme","os-sessions","os-session","os-plates",
            "os-plate","os-lang","os-cc","os-car-icon","os-car-color","os-base","os-accent","os-resexp"];
  var url=NEW;
  try{
    var data={}, n=0;
    KEYS.forEach(function(k){ var v=localStorage.getItem(k); if(v!==null && v.length<=20000){ data[k]=v; n++; } });
    if(n){
      var bytes=new TextEncoder().encode(JSON.stringify(data)), bin="";
      for(var i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
      var b=btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
      if(b.length<=80000) url=NEW+"#prenos="+b;
    }
  }catch(e){}
  var go=document.getElementById("go"); if(go) go.href=url;
  var lang=null; try{ lang=JSON.parse(localStorage.getItem("os-lang")); }catch(e){}
  if(lang==="en"){ var m=document.getElementById("msg"); if(m) m.textContent="Redirecting you in a moment, together with your plates and settings."; if(go) go.textContent="Open the new address"; }
  /* odjava starog service workera i brisanje starih spremnika, da nitko ne ostane na staroj verziji */
  var cleanup=Promise.resolve();
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
      cleanup=navigator.serviceWorker.getRegistrations().then(function(rs){ return Promise.all(rs.map(function(r){ return r.unregister(); })); }).catch(function(){});
    if(window.caches && caches.keys)
      cleanup=cleanup.then(function(){ return caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); }); }).catch(function(){});
  }catch(e){}
  var done=false;
  function redirect(){ if(done) return; done=true; location.replace(url); }
  cleanup.then(function(){ setTimeout(redirect,3000); });
  setTimeout(redirect,5000);
})();
