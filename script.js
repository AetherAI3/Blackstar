'use strict';
const toggle = document.getElementById('hamburger');
const menu = document.getElementById('nav-menu');
toggle.setAttribute('aria-controls', 'nav-menu');
toggle.setAttribute('aria-expanded', 'false');
function closeMenu(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();toggle.focus();}});
const items=[...document.querySelectorAll('.portfolio-item')];
document.querySelectorAll('.filter-btn').forEach(button=>{
 const filter=button.dataset.filter;
 if(filter!=='all'&&!items.some(item=>item.dataset.category===filter)){button.remove();return;}
 button.setAttribute('aria-pressed',String(button.classList.contains('active')));
 button.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});items.forEach(item=>{item.hidden=filter!=='all'&&item.dataset.category!==filter;});});
});
document.querySelectorAll('.port-img').forEach(img=>{img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;});});
const form=document.getElementById('contact-form');
form.removeAttribute('novalidate');
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const data=new FormData(form);
 const body=`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')||'Not selected'}\nBudget: ${data.get('budget')||'Not selected'}\n\n${data.get('message')}`;
 window.location.href='mailto:hello@blackstarentertainment.com?subject='+encodeURIComponent('Black Star project inquiry')+'&body='+encodeURIComponent(body);
 document.getElementById('form-success').textContent='Email draft requested. Send it from your email app to complete your inquiry. If no app opens, email hello@blackstarentertainment.com directly.';
});
const canvas=document.getElementById('starCanvas');const ctx=canvas.getContext('2d');
if(ctx){function drawStars(){const box=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=box.width*dpr;canvas.height=box.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,box.width,box.height);let seed=31;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<100;i++){const x=random()*box.width,y=random()*box.height,r=random()*1.1+.2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=`rgba(225,212,183,${random()*.5+.12})`;ctx.fill();}}drawStars();window.addEventListener('resize',drawStars);}
