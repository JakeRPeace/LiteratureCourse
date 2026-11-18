// Cover art sits on top of the cloth cover. If the art fails to load, take it
// away and the cloth cover with its foil title is already there.
document.querySelectorAll(".book-cover img").forEach((img) => {
  if (img.complete && img.naturalWidth === 0) {
    img.remove();
    return;
  }
  img.addEventListener("error", () => img.remove(), { once: true });
});
