!function(){"use strict";var t,r=(document.currentScript||{}).dataset||{},d=Array.prototype.forEach;function u(t){var e,a=this.tab,n=this.tabs||(this.tabs=a.closest(".tabs")),i=this.panel||(this.panel=document.getElementById(a.getAttribute("aria-controls")));d.call(n.querySelectorAll(".tablist .tab"),function(t){p(t,t===a)}),d.call(n.querySelectorAll(".tabpanel"),function(t){y(t,t!==i)}),!this.isSync&&"syncStorageKey"in r&&"syncGroupId"in n.dataset&&(n=r.syncStorageKey+"-"+n.dataset.syncGroupId,window[(r.syncStorageScope||"local")+"Storage"].setItem(n,a.dataset.syncId)),t&&(~(e=(n=window.location).hash?n.href.indexOf("#"):-1)&&window.history.replaceState(null,"",n.href.slice(0,e)),t.preventDefault())}function b(t){u.call(this,t);var a=this.tabs,n=this.tab,t=a.getBoundingClientRect().y,t=(d.call(document.querySelectorAll(".tabs"),function(e){e!==a&&e.dataset.syncGroupId===a.dataset.syncGroupId&&d.call(e.querySelectorAll(".tablist .tab"),function(t){t.dataset.syncId===n.dataset.syncId&&u.call({tabs:e,tab:t,isSync:!0})})}),a.getBoundingClientRect().y-t);(t=t&&Math.round(t))&&window.scrollBy({top:t,behavior:"instant"})}function e(t,e,a){d.call(t,function(t){t.classList[a](e)})}function y(t,e){t.classList[(t.hidden=e)?"add":"remove"]("is-hidden")}function p(t,e){t.setAttribute("aria-selected",""+e),t.classList[e?"add":"remove"]("is-selected"),t.tabIndex=e?0:-1}function a(){var t=window.location.hash.slice(1);!t||(t=document.getElementById(~t.indexOf("%")?decodeURIComponent(t):t))&&t.classList.contains("tab")&&("syncId"in t.dataset?b:u).call({tab:t})}(t=document.querySelectorAll(".tabs")).length&&(d.call(t,function(s){var l,o=s.classList.contains("is-sync")?{}:void 0,t=s.querySelector(".tablist ul");if(t.setAttribute("role","tablist"),d.call(t.querySelectorAll("li"),function(t,e){var a,n;if(t.setAttribute("role",t.className="tab"),!(a=t.id)){if(!(i=t.querySelector("a[id]")))return;t.id=a=i.parentNode.removeChild(i).id}var i=s.querySelector('.tabpanel[aria-labelledby~="'+a+'"]');i&&(t.tabIndex=-1,!o||(n=t.textContent.trim())in o&&!(n=void 0)||(o[t.dataset.syncId=n]=t),e||(l={tab:t,panel:i},o)?y(i,!0):p(t,!0),t.setAttribute("aria-controls",i.id),i.setAttribute("role","tabpanel"),d.call(i.querySelectorAll("table.tableblock"),function(t){var e=Object.assign(document.createElement("div"),{className:"tablecontainer"});t.parentNode.insertBefore(e,t).appendChild(t)}),t.addEventListener("click",(void 0===n?u:b).bind({tabs:s,tab:t,panel:i})))}),o&&l){for(var e,a,n=0,i=s.classList,c=i.length;n!==c;n++)if((a=i.item(n)).startsWith("data-sync-group-id=")){s.dataset.syncGroupId=e=i.remove(a)||a.slice(19).replace(/\u00a0/g," ");break}void 0===e&&(s.dataset.syncGroupId=e=Object.keys(o).sort().join("|"));t="syncStorageKey"in r&&window[(r.syncStorageScope||"local")+"Storage"].getItem(r.syncStorageKey+"-"+e),t=t&&o[t];t&&Object.assign(l,{tab:t,panel:document.getElementById(t.getAttribute("aria-controls"))}),p(l.tab,!0),y(l.panel,!1)}}),a(),e(t,"is-loading","remove"),window.setTimeout(e.bind(null,t,"is-loaded","add"),0),window.addEventListener("hashchange",a))}();