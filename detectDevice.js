function detectDevice() {
  const userAgent = navigator.userAgent;
  let deviceType = "Bilinmiyor";

  // Tabletleri ve mobil cihazları kontrol et
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    )
  ) {
    deviceType = 0;
  } else if (/Mac|Windows|Linux/i.test(userAgent)) {
    deviceType = 1;
  }

  return deviceType;
  //   0 => Mobile Phome or Tablet
  //   1 => Desktop Computer
}

const device = detectDevice();

if (device === 0) {
  document.getElementsByClassName("toggleButtons")[0].style.display = "flex";
}
