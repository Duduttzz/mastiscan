import { supabase } from "./supabaseClient.js";

// ---------------------------------------------------------
// 🧭 DETECTAR SE ESTÁ EM MODO "EDIÇÃO"
// ---------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const editId = params.get("id"); // se existir → modo edição

// mudar h2 da página
const titulo = document.querySelector("h2");
if (editId && titulo) {
  titulo.textContent = "Editar Cadastro";
}

const form = document.getElementById("formCadastroVaca");
const alerta = document.getElementById("alerta");
const mensagem = document.getElementById("mensagem");

// se existir "id" na URL, carregar dados da vaca
if (form && editId) {
  carregarDadosEdicao();
}

async function carregarDadosEdicao() {
  const { data, error } = await supabase
    .from("vacas")
    .select("*")
    .eq("id", editId)
    .single();

  if (error) {
    mostrarAviso("❌ Erro ao carregar dados da vaca: " + error.message, "erro");
    return;
  }

  // preencher campos
  form.nome.value = data.nome;
  form.identificacao.value = data.identificacao;
  form.raca.value = data.raca;
  form.dataNascimento.value = data.data_nascimento || "";
  form.status.value = data.status;

  // alterar botão
  const botao = form.querySelector("button[type='submit']");
  if (botao) botao.textContent = "Salvar Alterações";
}

// ---------------------------------------------------------
// 📄 SALVAR (CADASTRAR OU ATUALIZAR)
// ---------------------------------------------------------

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      nome: form.nome.value.trim(),
      identificacao: form.identificacao.value.trim(),
      raca: form.raca.value.trim(),
      data_nascimento: form.dataNascimento.value,
      status: form.status.value
    };

    let error = null;

    if (editId) {
      // 🔵 MODO EDIÇÃO
      ({ error } = await supabase
        .from("vacas")
        .update(payload)
        .eq("id", editId));
    } else {
      // 🟢 MODO CADASTRO
      ({ error } = await supabase.from("vacas").insert([payload]));
    }

    if (error) {
      mostrarAviso("❌ Erro ao salvar: " + error.message, "erro");
    } else {
      mostrarAviso(
        editId
          ? "✅ Dados atualizados com sucesso!"
          : "✅ Vaca cadastrada com sucesso!",
        "sucesso"
      );

      // redireciona após atualizar
      setTimeout(() => {
        window.location.href = "lista.html";
      }, 1500);
    }
  });
}

// ---------------------------------------------------------
// 📋 LISTAGEM DE VACAS
// ---------------------------------------------------------

const tabela = document.querySelector("#tabela-vacas tbody");

if (tabela) carregarVacas();

async function carregarVacas() {
  tabela.innerHTML = `<tr><td colspan="6" class="loading">Carregando vacas...</td></tr>`;

  const { data, error } = await supabase
    .from("vacas")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    tabela.innerHTML = `<tr><td colspan="6" class="loading">Erro ao carregar vacas: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tabela.innerHTML = `<tr><td colspan="6" class="loading">Nenhuma vaca cadastrada ainda.</td></tr>`;
    return;
  }

  tabela.innerHTML = "";

  data.forEach((vaca) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${vaca.identificacao}</td>
      <td>${vaca.nome}</td>
      <td>${vaca.raca ?? "-"}</td>
      <td>${formatarData(vaca.data_nascimento)}</td>
      <td>${vaca.status ?? "-"}</td>
      <td class="actions-cell">
        <button class="action evaluate" onclick="avaliacaoVaca('${vaca.id}')">
          <i data-lucide="stethoscope"></i>
        </button>
        <button class="action edit" onclick="editarVaca('${vaca.id}')">
          <i data-lucide="edit"></i>
        </button>
        <button class="action delete" onclick="excluirVaca('${vaca.id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    tabela.appendChild(tr);
  });

  lucide.createIcons();
}

// ---------------------------------------------------------
// 🗑️ EXCLUSÃO
// ---------------------------------------------------------

window.excluirVaca = async (id) => {
  if (!confirm("Deseja realmente excluir esta vaca?")) return;

  const { error } = await supabase.from("vacas").delete().eq("id", id);

  if (error) {
    alert("❌ Erro ao excluir: " + error.message);
  } else {
    alert("✅ Vaca excluída!");
    carregarVacas();
  }
};

// ---------------------------------------------------------
// ✏️ REDIRECIONAR PARA EDIÇÃO
// ---------------------------------------------------------

window.editarVaca = (id) => {
  window.location.href = `cadastro.html?id=${id}`;
};

// ---------------------------------------------------------
// 🔧 Utils
// ---------------------------------------------------------

function mostrarAviso(texto, tipo) {
  if (!alerta || !mensagem) return;
  mensagem.textContent = texto;
  alerta.className = `alerta ${tipo}`;
  alerta.classList.remove("oculto");

  setTimeout(() => {
    alerta.classList.add("oculto");
  }, 5000);
}

function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}
