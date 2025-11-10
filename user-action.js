let track = null;
let torchOn = false;
let listening = false;

async function enableMotion() {
	if (typeof DeviceMotionEvent !== 'undefined' &&
		typeof DeviceMotionEvent.requestPermission === 'function') {
		const state = await DeviceMotionEvent.requestPermission();
		if (state !== 'granted') throw new Error('Motion permission denied');
	}
	window.addEventListener('devicemotion', onMotion, { passive: true });
	listening = true;
}

async function enableTorch() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: { facingMode: { ideal: 'environment' } }
	});
	track = stream.getVideoTracks()[0];
	const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
	if (!caps.torch) {
		alert('Torch not supported on this device');
	}
}

async function setTorch(on) {
	if (!track) return;
	try {
		await track.applyConstraints({ advanced: [{ torch: on }] });
		torchOn = on;
	} catch (e) {
		console.error('Torch constraint failed:', e);
	}
}

let lastTime = 0;
function onMotion(e) {
	const a = e.accelerationIncludingGravity;
	if (!a) return;
	const now = Date.now();
	if (now - lastTime < 200) return;
	const magnitude = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
	if (magnitude > 20) {
		lastTime = now;
		setTorch(!torchOn);
	}
}

document.getElementById('enable').addEventListener('click', async () => {
	try {
		await enableMotion();
		await enableTorch();
		if ('wakeLock' in navigator && navigator.wakeLock?.request) {
			try { await navigator.wakeLock.request('screen'); } catch {}
		}
		alert('Shake detection enabled. Shake to toggle flashlight.');
	} catch (e) {
		alert('Unable to enable: ' + e.message);
	}
});

window.addEventListener('beforeunload', () => {
	if (track) track.stop();
	if (listening) window.removeEventListener('devicemotion', onMotion);
});
