// --- VARIÁVEIS GLOBAIS DE CONVERSÃO E FATOR DE CÁLCULO ---
const CONVERSAO_KG_LB = 2.20462;
const CONVERSAO_IN_CM = 0.393701;
const FATOR_CAL_PROT = 4;
const FATOR_CAL_CARB = 4;
const FATOR_CAL_GORD = 9;

/** Função para limpar a área de resultados. */
function resetarResultados() {
    document.getElementById('resultados').style.display = 'none';
    document.getElementById('tmb-resultado').textContent = '...';
    document.getElementById('get-resultado').textContent = '...';
    document.getElementById('calorias-objetivo').textContent = '...';
}

/** Calcula a Taxa de Metabolismo Basal (TMB) usando a Equação de Mifflin-St Jeor. */
function calcularTMBMifflin(peso, altura, idade, sexo) {
    if (sexo.toUpperCase() === 'M') {
        return (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
    } else {
        return (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
    }
}

/** Calcula TMB usando a fórmula de Katch-McArdle (requer percentual de gordura). */
function calcularTMBKatch(peso, percentualGordura) {
    if (percentualGordura <= 0 || percentualGordura >= 60) return 0; 
    
    const massaMagra = peso * (1 - (percentualGordura / 100));
    return 370 + (21.6 * massaMagra);
}

/** Calcula o Gasto Energético Total (GET) multiplicando a TMB pelo Fator de Atividade. */
function calcularGET(tmb, nivelAtividade) {
    const fatores = {
        'SEDENTARIO': 1.2,
        'LEVE': 1.375,
        'MODERADO': 1.55,
        'INTENSO': 1.725,
        'MUITO_INTENSO': 1.9
    };
    const fatorAtividade = fatores[nivelAtividade.toUpperCase()];
    return tmb * (fatorAtividade || 1.2); 
}

/** Calcula as calorias para atingir o objetivo (déficit ou superávit). */
function calcularCaloriasObjetivo(get, objetivo) {
    const ajustes = {
        'MANUTENCAO': 0,
        'PERDA_LEVE': -300,
        'PERDA_MODERADA': -500,
        'GANHO_LEVE': 300,
        'GANHO_MODERADA': 500
    };
    return get + (ajustes[objetivo.toUpperCase()] || 0);
}

/** Calcula a distribuição de Macronutrientes com base no objetivo. */
function calcularMacronutrientes(caloriasObjetivo, objetivo) {
    let protPerc, carbPerc, gordPerc, macroProporcaoTexto;
    
    switch (objetivo.toUpperCase()) {
        case 'PERDA_LEVE':
        case 'PERDA_MODERADA':
            protPerc = 0.40; carbPerc = 0.30; gordPerc = 0.30; 
            macroProporcaoTexto = '40% Prot / 30% Carb / 30% Gord';
            break;
        case 'GANHO_LEVE':
        case 'GANHO_MODERADA':
            protPerc = 0.30; carbPerc = 0.50; gordPerc = 0.20;
            macroProporcaoTexto = '30% Prot / 50% Carb / 20% Gord';
            break;
        case 'MANUTENCAO':
        default:
            protPerc = 0.30; carbPerc = 0.40; gordPerc = 0.30;
            macroProporcaoTexto = '30% Prot / 40% Carb / 30% Gord';
            break;
    }

    const protKcal = caloriasObjetivo * protPerc;
    const carbKcal = caloriasObjetivo * carbPerc;
    const gordKcal = caloriasObjetivo * gordPerc;

    const protG = protKcal / FATOR_CAL_PROT;
    const carbG = carbKcal / FATOR_CAL_CARB;
    const gordG = gordKcal / FATOR_CAL_GORD;

    const totalKcal = protKcal + carbKcal + gordKcal;
    
    return {
        protG: Math.round(protG), carbG: Math.round(carbG), gordG: Math.round(gordG),
        protPerc: Math.round(protPerc * 100), carbPerc: Math.round(carbPerc * 100), gordPerc: Math.round(gordPerc * 100),
        totalKcal: Math.round(totalKcal),
        proporcaoTexto: macroProporcaoTexto
    };
}

/** Ajusta os rótulos de unidade na interface (Métrico/Imperial). */
function ajustarUnidades() {
    const isMetric = document.querySelector('input[name="unidade"]:checked').value === 'metric';
    document.getElementById('label-peso').textContent = isMetric ? 'Peso (kg):' : 'Peso (lb):';
    document.getElementById('label-altura').textContent = isMetric ? 'Altura (cm):' : 'Altura (in):';
}

/** Mapeia o código do objetivo para um texto amigável. */
function getTextoObjetivo(objetivo) {
    const textos = {
        'MANUTENCAO': 'Manutenção de Peso', 'PERDA_LEVE': 'Perda de Peso Leve', 
        'PERDA_MODERADA': 'Perda de Peso Moderada', 'GANHO_LEVE': 'Ganho de Massa Leve', 
        'GANHO_MODERADA': 'Ganho de Massa Moderado'
    };
    return textos[objetivo.toUpperCase()] || 'Objetivo Não Definido';
}

/** Função principal que coleta dados e exibe o resultado. */
function realizarCalculo() {
    // ZERA RESULTADOS NO INÍCIO PARA GARANTIR FEEDBACK
    resetarResultados();
    
    // Coleta e preparação de dados (USANDO NUMBER() para forçar leitura numérica)
    const isMetric = document.querySelector('input[name="unidade"]:checked').value === 'metric';
    
    let peso = Number(document.getElementById('peso').value);
    let altura = Number(document.getElementById('altura').value);
    const idade = Number(document.getElementById('idade').value);
    
    const sexo = document.getElementById('sexo').value;
    const percentualGordura = Number(document.getElementById('percentualGordura').value);
    const nivelAtividade = document.getElementById('atividade').value;
    const objetivo = document.getElementById('objetivo').value;

    // 1.1 Conversão de Imperial para Métrico se necessário
    if (!isMetric) {
        peso = peso / CONVERSAO_KG_LB; 
        altura = altura * CONVERSAO_IN_CM;
    }

    // 2. Validação dos dados OBRIGATÓRIOS
    if (peso <= 0 || altura <= 0 || idade <= 0 || !Number.isFinite(peso) || !Number.isFinite(altura) || !Number.isFinite(idade) || sexo === '' || nivelAtividade === '' || objetivo === '') {
         alert('Por favor, preencha todos os campos obrigatórios: Peso, Altura, Idade, Sexo, Nível de Atividade e Objetivo, com valores positivos.');
        return;
    }

    try {
        let tmbResultado = 0;
        let formulaUsada = '(Mifflin-St Jeor)';
        // Usando Number.isFinite para garantir que a entrada é um número real
        const percGorduraValido = Number.isFinite(percentualGordura) && percentualGordura > 0 && percentualGordura < 60;
        
        // 3. Calcular TMB (Prioriza Katch-McArdle)
        if (percGorduraValido) {
            tmbResultado = calcularTMBKatch(peso, percentualGordura);
            formulaUsada = '(Katch-McArdle - Baseada na Massa Magra)';
        }
        if (tmbResultado <= 0) { 
            tmbResultado = calcularTMBMifflin(peso, altura, idade, sexo);
            if (!percGorduraValido) formulaUsada = '(Mifflin-St Jeor)'; 
            else if (tmbResultado > 0) formulaUsada += ' -> Retornando para Mifflin-St Jeor'; 
        }

        tmbResultado = Math.round(tmbResultado);

        if (tmbResultado <= 500) { 
             throw new Error("O TMB calculado é muito baixo. Verifique os dados inseridos.");
        }

        // 4. Calcular GET
        const getResultado = Math.round(calcularGET(tmbResultado, nivelAtividade));

        // 5. Calcular Calorias por Objetivo
        const caloriasObjetivo = calcularCaloriasObjetivo(getResultado, objetivo);
        
        // 6. Calcular Macros
        const macros = calcularMacronutrientes(caloriasObjetivo, objetivo);


        // 7. Exibir resultados
        document.getElementById('formula-tmb-usada').textContent = formulaUsada;
        document.getElementById('tmb-resultado').textContent = tmbResultado.toLocaleString('pt-BR');
        document.getElementById('get-resultado').textContent = getResultado.toLocaleString('pt-BR');
        document.getElementById('objetivo-texto-final').textContent = getTextoObjetivo(objetivo);
        document.getElementById('calorias-objetivo').textContent = Math.round(caloriasObjetivo).toLocaleString('pt-BR');

        // Exibir Macros Dinâmicos
        document.getElementById('macro-titulo-proporcao').textContent = `Distribuição de Macronutrientes (${macros.proporcaoTexto})`;
        document.getElementById('prot-gramas').textContent = macros.protG.toLocaleString('pt-BR');
        document.getElementById('carb-gramas').textContent = macros.carbG.toLocaleString('pt-BR');
        document.getElementById('gord-gramas').textContent = macros.gordG.toLocaleString('pt-BR');
        
        document.getElementById('prot-perc-display').textContent = `Proteínas (${macros.protPerc}%)`;
        document.getElementById('carb-perc-display').textContent = `Carboidratos (${macros.carbPerc}%)`;
        document.getElementById('gord-perc-display').textContent = `Gorduras (${macros.gordPerc}%)`;
        
        document.getElementById('macro-total-kcal').textContent = `${macros.totalKcal.toLocaleString('pt-BR')} kcal`;
        
        document.getElementById('resultados').style.display = 'block';

    } catch (error) {
        alert('Falha no cálculo. Verifique os dados inseridos. Detalhe: ' + error.message);
    }
}

// Inicializa a página após o carregamento, garantindo que o DOM esteja pronto
window.onload = function() {
    ajustarUnidades();
};
