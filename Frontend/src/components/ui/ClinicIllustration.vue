<template>
  <article class="illustration surface-card" aria-hidden="true">
    <svg viewBox="0 0 320 240" class="svg">
      <defs>
        <linearGradient id="coat" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#fafdff" />
          <stop offset="100%" stop-color="#dfeef7" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#78b9d8" />
          <stop offset="100%" stop-color="#6ed0bc" />
        </linearGradient>
      </defs>

      <circle cx="250" cy="60" r="42" fill="#e4f1f7" />
      <circle cx="75" cy="54" r="30" fill="#e8f6f2" />

      <circle cx="160" cy="70" r="28" fill="#f2c9b3" />
      <path d="M126 63c8-24 58-28 70 3-12 6-21 7-35 8-15-1-23-2-35-11Z" fill="#2e586e" />

      <path d="M110 190c2-46 27-74 50-74s49 28 50 74H110Z" fill="url(#coat)" />
      <path d="M154 118h12v72h-12z" fill="#cfe2ee" />
      <circle cx="160" cy="130" r="4" fill="#7ba9c0" />
      <circle cx="160" cy="146" r="4" fill="#7ba9c0" />

      <path d="M133 120c0 16 10 32 27 36" stroke="#6fb8b0" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M187 120c0 16-10 32-27 36" stroke="#6fb8b0" stroke-width="6" fill="none" stroke-linecap="round" />
      <circle cx="160" cy="158" r="10" fill="#6fb8b0" />

      <rect x="224" y="105" width="66" height="48" rx="10" fill="#f7fdff" stroke="#b9d9e8" />
      <rect x="251" y="114" width="12" height="30" rx="3" fill="url(#accent)" />
      <rect x="242" y="123" width="30" height="12" rx="3" fill="url(#accent)" />
    </svg>
  </article>
</template>

<style scoped>
.illustration {
  padding: 10px;
  background:
    radial-gradient(circle at 20% 10%, rgba(120, 185, 216, 0.25), transparent 52%),
    radial-gradient(circle at 90% 70%, rgba(110, 208, 188, 0.22), transparent 46%),
    rgba(255, 255, 255, 0.75);
}
.svg {
  width: 100%;
  height: 100%;
  max-height: 240px;
}
</style>
