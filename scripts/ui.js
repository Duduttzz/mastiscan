export function mostrarMensagem(texto, tipo = "info") {
  const feedback = document.getElementById("feedback");
  if (!feedback) return;

  feedback.textContent = texto;
  feedback.style.color = tipo === "erro" ? "red" : "green";

  setTimeout(() => (feedback.textContent = ""), 3000);
}
