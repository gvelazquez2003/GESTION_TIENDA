'use strict';

const CURRENT_APPS_SCRIPT_URL = '';
const APPS_SCRIPT_URL = String(window.APPS_SCRIPT_URL || CURRENT_APPS_SCRIPT_URL || '').trim();
const APPS_SCRIPT_PROXY_URL = '/api/apps-script';

const state = {
  products: [],
  motivosSalida: [],
  activeModule: 'Inventario Inicial',
};

const elements = {
  envWarning: document.getElementById('env-warning'),
  form: document.getElementById('inventory-form'),
  submitButton: null,
  productoInput: document.getElementById('producto'),
  productosList: document.getElementById('listaProductos'),
  motivoBox: document.getElementById('contenedor-motivo'),
  motivoSelect: document.getElementById('motivo'),
  motivoOtroInput: document.getElementById('motivo-otro'),
  toast: document.getElementById('toast'),
  standbyOverlay: document.getElementById('standby-overlay'),
  standbyMessage: document.getElementById('standby-message'),
  moduleButtons: {
    'btn-inicial': document.getElementById('btn-inicial'),
    'btn-recibido': document.getElementById('btn-recibido'),
    'btn-salidas': document.getElementById('btn-salidas'),
    'btn-cierre': document.getElementById('btn-cierre'),
  },
};

elements.submitButton = elements.form ? elements.form.querySelector('button[type="submit"]') : null;

init();

function init() {
  setupModuleButtons();
  setupMotivoField();
  setupForm();
  setTodayOnDate();
  toggleEnvWarning(!APPS_SCRIPT_URL);
  fetchCatalogs();
}

function setupModuleButtons() {
  Object.entries(elements.moduleButtons).forEach(([buttonId, button]) => {
    if (!button) return;
    button.addEventListener('click', () => {
      const moduleName = {
        'btn-inicial': 'Inventario Inicial',
        'btn-recibido': 'Recibido',
        'btn-salidas': 'Salidas',
        'btn-cierre': 'Inventario Cierre',
      }[buttonId];

      state.activeModule = moduleName;
      setActiveButton(buttonId);

      if (moduleName === 'Salidas') {
        showMotivoBox();
      } else {
        hideMotivoBox();
      }
    });
  });
}

function setActiveButton(activeId) {
  Object.entries(elements.moduleButtons).forEach(([buttonId, button]) => {
    if (!button) return;
    button.classList.toggle('active', buttonId === activeId);
  });
}

function setupMotivoField() {
  if (!elements.motivoSelect) return;
  elements.motivoSelect.addEventListener('change', () => {
    const isOther = elements.motivoSelect.value === 'Otro';
    if (!elements.motivoOtroInput) return;
    elements.motivoOtroInput.classList.toggle('hidden', !isOther);
    elements.motivoOtroInput.required = isOther;
    if (!isOther) {
      elements.motivoOtroInput.value = '';
    }
  });
}

function setupForm() {
  if (!elements.form) return;

  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.activeModule) {
      showToast('Selecciona un modulo.', 'error');
      return;
    }

    const formData = new FormData(elements.form);
    const parsedProduct = resolveProduct(formData.get('producto'));
    if (!parsedProduct) {
      showToast('Selecciona un producto valido del catalogo.', 'error');
      return;
    }

    const quantity = Number(formData.get('cantidad'));
    if (!Number.isInteger(quantity) || quantity <= 0) {
      showToast('La cantidad debe ser un numero entero mayor a cero.', 'error');
      return;
    }

    const motivoSalida = resolveMotivoSalida(formData);
    if (state.activeModule === 'Salidas' && !motivoSalida) {
      showToast('Selecciona un motivo de salida.', 'error');
      return;
    }

    const payload = {
      hoja_destino: mapSheetName(state.activeModule),
      tipo_movimiento: state.activeModule,
      fecha: String(formData.get('fecha') || '').trim(),
      codigo: parsedProduct.codigo,
      producto: parsedProduct.producto,
      cantidad: quantity,
      sede: String(formData.get('sede') || '').trim(),
      responsable: String(formData.get('responsable') || '').trim(),
      observaciones: String(formData.get('observaciones') || '').trim(),
      motivo_salida: motivoSalida,
    };

    if (!payload.fecha || !payload.sede || !payload.responsable) {
      showToast('Completa los campos obligatorios.', 'error');
      return;
    }

    toggleLoading(true, 'Guardando...');
    showStandby('Cargando...');
    try {
      const result = await postData(payload);
      if (!result || result.success === false) {
        throw new Error(result?.message || 'No se pudo guardar el registro.');
      }
      showToast('Registro guardado correctamente.', 'success');
      elements.form.reset();
      setTodayOnDate();
      hideMotivoBox();
      state.activeModule = 'Inventario Inicial';
      setActiveButton('btn-inicial');
      if (elements.motivoSelect) elements.motivoSelect.value = '';
      if (elements.motivoOtroInput) {
        elements.motivoOtroInput.value = '';
        elements.motivoOtroInput.classList.add('hidden');
        elements.motivoOtroInput.required = false;
      }
    } catch (error) {
      showToast(error.message || 'No se pudo guardar el registro.', 'error');
    } finally {
      hideStandby();
      toggleLoading(false, 'Guardar Registro');
    }
  });
}

function mapSheetName(moduleName) {
  return {
    'Inventario Inicial': 'INVENTARIO INICIAL',
    'Recibido': 'RECIBIDO',
    'Salidas': 'SALIDAS',
    'Inventario Cierre': 'INVENTARIO CIERRE',
  }[moduleName] || 'INVENTARIO INICIAL';
}

function resolveProduct(rawValue) {
  const value = normalizeText(rawValue);
  if (!value) return null;

  const fromCatalog = state.products.find((item) => {
    const byCode = normalizeText(item.codigo);
    const byLabel = normalizeText(`${item.codigo} ${item.producto}`);
    const byName = normalizeText(item.producto);
    return value === byCode || value === byLabel || value === byName;
  });

  return fromCatalog || null;
}

function resolveMotivoSalida(formData) {
  if (state.activeModule !== 'Salidas') return '';
  const motive = String(formData.get('motivo') || '').trim();
  if (motive === 'Otro') {
    return String(formData.get('motivo-otro') || '').trim();
  }
  return motive;
}

function hideMotivoBox() {
  if (elements.motivoBox) elements.motivoBox.classList.add('hidden');
}

function showMotivoBox() {
  if (elements.motivoBox) elements.motivoBox.classList.remove('hidden');
}

function toggleEnvWarning(show) {
  if (!elements.envWarning) return;
  elements.envWarning.classList.toggle('hidden', !show);
}

function setTodayOnDate() {
  const dateInput = elements.form?.querySelector('input[name="fecha"]');
  if (!dateInput) return;
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  dateInput.value = local.toISOString().slice(0, 10);
}

async function fetchCatalogs() {
  if (!APPS_SCRIPT_URL) return;

  try {
    const response = await fetch(`${APPS_SCRIPT_PROXY_URL}?target=${encodeURIComponent(APPS_SCRIPT_URL)}&action=getCatalogs`, {
      cache: 'no-store',
    });
    const data = await readJsonResponse(response);
    if (!data.success) {
      throw new Error(data.message || 'No se pudieron cargar los catalogos.');
    }

    state.products = Array.isArray(data.data?.products) ? data.data.products : [];
    state.motivosSalida = Array.isArray(data.data?.motivosSalida) ? data.data.motivosSalida : [];

    renderProductOptions();
    renderMotivosOptions();
  } catch (error) {
    showToast(error.message || 'No se pudieron sincronizar los catalogos.', 'error');
  }
}

function renderProductOptions() {
  if (!elements.productosList) return;
  elements.productosList.innerHTML = state.products.map((item) => {
    const label = `${item.codigo} ${item.producto}`.trim();
    return `<option value="${escapeHtml(label)}"></option>`;
  }).join('');
}

function renderMotivosOptions() {
  if (!elements.motivoSelect) return;

  const options = ['<option value="" disabled selected>Seleccione un motivo...</option>'];
  state.motivosSalida.forEach((motivo) => {
    options.push(`<option value="${escapeHtml(motivo)}">${escapeHtml(motivo)}</option>`);
  });
  options.push('<option value="Otro">Otro...</option>');
  elements.motivoSelect.innerHTML = options.join('');
}

async function postData(payload) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Configura la URL del Apps Script en el archivo script.js.');
  }

  const response = await fetch(`${APPS_SCRIPT_PROXY_URL}?target=${encodeURIComponent(APPS_SCRIPT_URL)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'guardarRegistro', payload }),
  });

  return readJsonResponse(response);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) {
    return { success: response.ok };
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

function showStandby(message) {
  if (elements.standbyMessage) elements.standbyMessage.textContent = message;
  elements.standbyOverlay?.classList.remove('hidden');
  document.body.classList.add('is-busy');
}

function hideStandby() {
  elements.standbyOverlay?.classList.add('hidden');
  document.body.classList.remove('is-busy');
}

function toggleLoading(isLoading, label) {
  if (!elements.submitButton) return;
  elements.submitButton.disabled = Boolean(isLoading);
  elements.submitButton.textContent = label;
}

function showToast(message, type) {
  if (!elements.toast) {
    alert(message);
    return;
  }
  elements.toast.textContent = message;
  elements.toast.className = `toast toast--show toast--${type || 'info'}`;
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3200);
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeNetworkError(error) {
  if (error instanceof Error) return error;
  return new Error(String(error || 'Error de red.'));
}
