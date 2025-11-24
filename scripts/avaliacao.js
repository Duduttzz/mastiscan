import { supabase } from "./supabaseClient.js";

const params = new URLSearchParams(window.location.search);
const vacaIdRaw = params.get("id");
const vacaId = vacaIdRaw ? Number(vacaIdRaw) : null;

if (!vacaId) {
  alert("Nenhuma vaca selecionada. Volte para a lista e escolha uma vaca.");
  window.location.href = "lista.html";
}

// DOM
const alerta = document.getElementById("alerta");
const mensagem = document.getElementById("mensagem");

const inputNome = document.getElementById("nome");
const inputIdent = document.getElementById("identificacao");
const inputRaca = document.getElementById("raca");
const inputStatus = document.getElementById("status");

const form = document.getElementById("formAvaliacao");
const sintomasEl = document.getElementById("sintomas");
const observacoesEl = document.getElementById("observacoes");
const cmtEl = document.getElementById("cmt");
const condEl = document.getElementById("condutividade");

let avaliacaoAtual = null;

// Função para mostrar alertas
function mostrarAviso(texto, tipo = "info") {
  if (!alerta || !mensagem) {
    console.log(tipo.toUpperCase(), texto);
    return;
  }
  mensagem.textContent = texto;
  alerta.className = `alerta ${tipo}`;
  alerta.classList.remove("oculto");
  setTimeout(() => alerta.classList.add("oculto"), 4000);
}

// Carregar informações da vaca
async function carregarVaca() {
  try {
    const { data, error } = await supabase
      .from("vacas")
      .select("id, nome, identificacao, raca, status")
      .eq("id", vacaId)
      .single();
    if (error) throw error;

    inputNome.value = data.nome ?? "";
    inputIdent.value = data.identificacao ?? "";
    inputRaca.value = data.raca ?? "";
    inputStatus.value = data.status ?? "";
  } catch (err) {
    console.error("Erro ao carregar vaca:", err);
    mostrarAviso("Erro ao carregar dados da vaca.", "erro");
  }
}

// Carregar avaliação anterior
async function carregarAvaliacao() {
  try {
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*")
      .eq("vaca_id", vacaId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return;

    avaliacaoAtual = data[0];

    sintomasEl.value = Array.isArray(avaliacaoAtual.sintomas)
      ? avaliacaoAtual.sintomas.join(", ")
      : avaliacaoAtual.sintomas ?? "";

    cmtEl.value = avaliacaoAtual.cmt ?? "";
    condEl.value = avaliacaoAtual.condutividade ?? "";
    observacoesEl.value = avaliacaoAtual.observacoes ?? "";

  } catch (err) {
    console.error("Erro ao carregar avaliação:", err);
    mostrarAviso("Erro ao carregar avaliação.", "erro");
  }
}

// Salvar avaliação
async function salvarAvaliacao(e) {
  e.preventDefault();

  const sintomasSelecionados = sintomasEl.value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const payload = {
    vaca_id: vacaId,
    sintomas: sintomasSelecionados,
    cmt: cmtEl?.value ?? null,
    condutividade: condEl?.value ? Number(condEl.value) : null,
    observacoes: observacoesEl?.value ?? null,
    updated_at: new Date().toISOString()
  };

  try {
    let resp;
    if (avaliacaoAtual && avaliacaoAtual.id) {
      resp = await supabase.from("avaliacoes").update(payload).eq("id", avaliacaoAtual.id).select();
    } else {
      resp = await supabase.from("avaliacoes").insert([payload]).select();
    }

    if (resp.error) throw resp.error;

    avaliacaoAtual = resp.data[0];
    mostrarAviso("Avaliação salva com sucesso!", "sucesso");
    setTimeout(() => window.location.href = "lista.html", 900);

  } catch (err) {
    console.error("Erro ao salvar avaliação:", err);
    mostrarAviso("Falha ao salvar avaliação.", "erro");
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  if (form) form.addEventListener("submit", salvarAvaliacao);
  carregarVaca().then(() => carregarAvaliacao());
});
