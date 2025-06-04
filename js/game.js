// Adicionei estas variáveis globais no início do arquivo
let gameStarted = false;
let canvas, ctx;
let nave;
let asteroids = [];
let tiros = [];
let naveInimiga = null;     // Adicione esta linha
let tirosInimigos = [];     // Adicione esta linha
let ultimoPontoSpawn = 0;   // Mova para cá
let teclas;                 // Mova para cá
let ultimoSpawnNaveInimiga = 0; // Adicione no início do arquivo junto com as outras variáveis globais

// O resto das variáveis globais
let vidas = 3;
let podeAtirar = true;
let delayTiro = 250; // 250ms entre tiros
let imagens = {
    background: null,
    nave: null,
    naveInimiga: null,
    asteroideGrande: null,
    asteroideMedio: null,
    asteroidePequeno: null
};
let pontuacao = 0;
let invencivel = false;
const TEMPO_INVENCIBILIDADE = 2000; // 2 segundos de invencibilidade após ser atingido

// Modifiquei as configurações do jogo
const NAVE_TAMANHO = 20;
const VELOCIDADE_NAVE = 0.2; // Reduzido para melhor controle com inércia
const VELOCIDADE_TIRO = 10;
const VELOCIDADE_ROTACAO = 5;

const TAMANHO_ASTEROIDE = {
    grande: 30,  // Tamanho do asteroide grande
    medio: 20,   // Tamanho do asteroide médio
    pequeno: 10  // Tamanho do asteroide pequeno
};

// Configurações para asteroides
const ASTEROIDE_CONFIG = {
    velocidadeMin: 0.5, // Era 1
    velocidadeMax: 2,   // Era 5
    spawn: {
        intervaloMin: 2000,
        intervaloMax: 5000
    }
};

// Adicionei no início do arquivo junto com as outras constantes
const NAVE_INIMIGA = {
    tamanho: 30,         // Aumentado de 20 para 30
    velocidade: 3,       // Aumentado de 2 para 3
    velocidadeTiro: 5,
    alcanceTiro: 200, // Distância máxima do tiro
    delayTiro: 500
};

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar eventos
    $('#inicio').on('click', startGame);
});

// Modifiquei a função startGame para incluir o carregamento de imagens
async function startGame() {
    if (!gameStarted) {
        console.log('Iniciando jogo...');
        gameStarted = true;
        $('#inicio').hide();
        
        // Aguarda o carregamento das imagens
        try {
            await carregarImagens();
            console.log('Imagens carregadas com sucesso');
        } catch (e) {
            console.error('Erro ao carregar imagens:', e);
        }
        
        // Inicializar objetos do jogo
        inicializarJogo();
        
        // Guarda a referência das teclas
        teclas = setupControles();
        
        // Iniciar loop do jogo
        gameLoop();
    }
}

// Adicionei esta função para carregar imagens
function carregarImagens() {
    return new Promise((resolve) => {
        const imageUrls = {
            background: 'img/background.jpg',
            nave: 'img/nave.png',
            naveInimiga: 'img/nave_inimiga.png',
            asteroideGrande: 'img/asteroide_grande.png',
            asteroideMedio: 'img/asteroide_medio.png',
            asteroidePequeno: 'img/asteroide_pequeno.png'
        };

        console.log('Iniciando carregamento das imagens...');
        
        let imagensCarregadas = 0;
        const totalImagens = Object.keys(imageUrls).length;

        for (let key in imageUrls) {
            const caminhoCompleto = window.location.origin + '/' + imageUrls[key];
            console.log(`Tentando carregar ${key} de:`, caminhoCompleto);
            
            imagens[key] = new Image();
            
            imagens[key].onload = () => {
                console.log(`Imagem ${key} carregada:`, {
                    width: imagens[key].width,
                    height: imagens[key].height,
                    src: imagens[key].src
                });
                imagensCarregadas++;
                if (imagensCarregadas === totalImagens) {
                    console.log('Todas as imagens foram carregadas:', imagens);
                    resolve();
                }
            };
            
            imagens[key].onerror = (e) => {
                console.error(`Erro ao carregar ${key}:`, {
                    src: imageUrls[key],
                    caminhoCompleto: caminhoCompleto,
                    erro: e
                });
                imagensCarregadas++;
                imagens[key].error = true;
                if (imagensCarregadas === totalImagens) resolve();
            };
            
            imagens[key].src = imageUrls[key];
        }
    });
}

// Adicionei as constantes de pontuação
const PONTUACAO = {
    pequeno: 10,
    medio: 20,
    grande: 40
};

// Modifiquei a função inicializarJogo
function inicializarJogo() {
    vidas = 3;
    pontuacao = 0;
    ultimoPontoSpawn = 0;
    ultimoSpawnNaveInimiga = 0; // Modifique a função inicializarJogo para resetar esta variável
    naveInimiga = null;     // Adicione esta linha
    tirosInimigos = [];     // Adicione esta linha
    
    nave = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        velocidade: VELOCIDADE_NAVE,
        angulo: 0,
        dx: 0,
        dy: 0,
        raio: NAVE_TAMANHO / 2
    };
    
    asteroids = [];
    tiros = [];
    criarAsteroides(3);
}

// Modifiquei a função setupControles
function setupControles() {
    const teclas = {
        w: false,
        a: false,
        d: false,
        ' ': false
    };
    
    let ultimoTiro = 0;
    
    $(document).on('keydown', function(e) {
        if (!gameStarted) return;
        const key = e.key.toLowerCase();
        if (key in teclas) {
            teclas[key] = true;
        }
    });

    $(document).on('keyup', function(e) {
        const key = e.key.toLowerCase();
        if (key in teclas) {
            teclas[key] = false;
        }
    });

    // Adiciona função para verificar tiro
    teclas.verificarTiro = function() {
        const agora = Date.now();
        if (teclas[' '] && agora - ultimoTiro >= delayTiro) {
            atirar();
            ultimoTiro = agora;
        }
    };

    return teclas;
}

// Modifiquei a função atirar
function atirar() {
    const angulo = nave.angulo * Math.PI / 180;
    tiros.push({
        x: nave.x,
        y: nave.y,
        dx: Math.cos(angulo) * VELOCIDADE_TIRO,
        dy: Math.sin(angulo) * VELOCIDADE_TIRO,
        distanciaPercorrida: 0,
        raio: 2
    });
}

// Função para gerar número aleatório entre min e max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Função para criar um asteroide com características aleatórias
function criarAsteroideAleatorio() {
    // Determina de qual lado o asteroide vai aparecer
    const lado = Math.floor(Math.random() * 4); // 0: topo, 1: direita, 2: baixo, 3: esquerda
    let x, y;

    switch(lado) {
        case 0: // topo
            x = random(0, canvas.width);
            y = -TAMANHO_ASTEROIDE.grande;
            break;
        case 1: // direita
            x = canvas.width + TAMANHO_ASTEROIDE.grande;
            y = random(0, canvas.height);
            break;
        case 2: // baixo
            x = random(0, canvas.width);
            y = canvas.height + TAMANHO_ASTEROIDE.grande;
            break;
        case 3: // esquerda
            x = -TAMANHO_ASTEROIDE.grande;
            y = random(0, canvas.height);
            break;
    }

    // Calcula velocidade aleatória direcionada ao centro
    const angulo = Math.atan2(canvas.height/2 - y, canvas.width/2 - x);
    const velocidade = random(ASTEROIDE_CONFIG.velocidadeMin, ASTEROIDE_CONFIG.velocidadeMax);

    return {
        x: x,
        y: y,
        tamanho: TAMANHO_ASTEROIDE.grande,
        tipo: 'grande',
        dx: Math.cos(angulo) * velocidade,
        dy: Math.sin(angulo) * velocidade,
        raio: TAMANHO_ASTEROIDE.grande / 2,
        rotacao: random(0, Math.PI * 2),
        velocidadeRotacao: random(-0.02, 0.02)
    };
}

// Modifiquei a função criarAsteroides
function criarAsteroides(quantidade) {
    for (let i = 0; i < quantidade; i++) {
        asteroids.push(criarAsteroideAleatorio());
    }
}

// Função para verificar se asteroide está fora da tela
function asteroideForaDaTela(asteroide) {
    return (asteroide.x < -asteroide.tamanho * 2 ||
            asteroide.x > canvas.width + asteroide.tamanho * 2 ||
            asteroide.y < -asteroide.tamanho * 2 ||
            asteroide.y > canvas.height + asteroide.tamanho * 2);
}

// Adicionei esta função para verificar colisões
function verificarColisoes() {
    // Colisão entre tiros e asteroides
    for (let i = tiros.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (detectarColisao(tiros[i], asteroids[j])) {
                const asteroide = asteroids[j];
                
                // Remove o tiro
                tiros.splice(i, 1);
                
                // Remove o asteroide
                asteroids.splice(j, 1);
                
                // Adiciona pontuação baseada no tipo
                pontuacao += PONTUACAO[asteroide.tipo];
                
                // Divide asteroides baseado no tipo
                if (asteroide.tipo === 'grande') {
                    criarAsteroideMenor(asteroide, 'medio', 2);
                } else if (asteroide.tipo === 'medio') {
                    criarAsteroideMenor(asteroide, 'pequeno', 3);
                }
                
                break;
            }
        }
    }

    // Colisão entre nave e asteroides
    if (!invencivel) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (detectarColisao(nave, asteroids[j])) {
                const asteroide = asteroids[j];
                
                // Remove o asteroide
                asteroids.splice(j, 1);
                
                // Divide o asteroide baseado no tipo
                if (asteroide.tipo === 'grande') {
                    criarAsteroideMenor(asteroide, 'medio', 2);
                } else if (asteroide.tipo === 'medio') {
                    criarAsteroideMenor(asteroide, 'pequeno', 3);
                }
                
                vidas--;
                if (vidas <= 0) {
                    gameOver();
                } else {
                    resetarPosicaoNave();
                    invencivel = true;
                    setTimeout(() => {
                        invencivel = false;
                    }, TEMPO_INVENCIBILIDADE);
                }
                break;
            }
        }
    }

    // Colisão entre tiros inimigos e nave
    if (!invencivel) {
        for (let i = tirosInimigos.length - 1; i >= 0; i--) {
            if (detectarColisao(nave, tirosInimigos[i])) {
                tirosInimigos.splice(i, 1);
                vidas--;
                if (vidas <= 0) {
                    gameOver();
                } else {
                    resetarPosicaoNave();
                    invencivel = true;
                    setTimeout(() => {
                        invencivel = false;
                    }, TEMPO_INVENCIBILIDADE);
                }
                break;
            }
        }
    }

    // Colisão entre tiros da nave e nave inimiga
    if (naveInimiga) {
        for (let i = tiros.length - 1; i >= 0; i--) {
            if (detectarColisao(naveInimiga, tiros[i])) {
                tiros.splice(i, 1);
                naveInimiga = null;
                pontuacao += 100; // Pontuação por destruir nave inimiga
                break;
            }
        }
    }
}

// Modifiquei a função criarAsteroideMenor
function criarAsteroideMenor(asteroideOriginal, novoTipo, quantidade) {
    for (let i = 0; i < quantidade; i++) {
        const velocidade = random(1, 3);
        const angulo = random(0, Math.PI * 2);
        
        asteroids.push({
            x: asteroideOriginal.x,
            y: asteroideOriginal.y,
            tamanho: TAMANHO_ASTEROIDE[novoTipo],
            tipo: novoTipo,
            dx: Math.cos(angulo) * velocidade,
            dy: Math.sin(angulo) * velocidade,
            raio: TAMANHO_ASTEROIDE[novoTipo] / 2,
            rotacao: random(0, Math.PI * 2),
            velocidadeRotacao: random(-0.02, 0.02)
        });
    }
}

// Função para detectar colisão entre dois objetos circulares
function detectarColisao(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < obj1.raio + obj2.raio;
}

// Função para resetar posição da nave após colisão
function resetarPosicaoNave() {
    // Reset da posição
    nave.x = canvas.width / 2;
    nave.y = canvas.height / 2;
    nave.angulo = 0;
    nave.movendo = false;
    nave.dx = 0;
    nave.dy = 0;
}

// Função de game over
function gameOver() {
    gameStarted = false;
    $('#inicio').show();
    $('#inicio h1').text('Game Over');
    $('#inicio p:first').text(`Pontuação Final: ${pontuacao}`);
}

function draw() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar fundo
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha background
    try {
        if (imagens.background && imagens.background.complete && !imagens.background.error) {
            ctx.drawImage(imagens.background, 0, 0, canvas.width, canvas.height);
        }
    } catch (e) {
        console.warn('Erro ao desenhar fundo:', e);
    }
    
    // Desenhar asteroides
    asteroids.forEach(asteroide => desenharAsteroide(asteroide));
    
    // Desenhar tiros
    ctx.fillStyle = 'white';
    tiros.forEach(tiro => {
        ctx.beginPath();
        ctx.arc(tiro.x, tiro.y, tiro.raio, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Desenhar tiros inimigos (adicione antes de desenhar a nave)
    ctx.fillStyle = 'yellow'; // Cor amarela para tiros inimigos
    tirosInimigos.forEach(tiro => {
        ctx.beginPath();
        ctx.arc(tiro.x, tiro.y, tiro.raio, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Desenhar nave
    ctx.save();
    ctx.translate(nave.x, nave.y);
    ctx.rotate(nave.angulo * Math.PI / 180);

    try {
        if (imagens.nave && imagens.nave.complete && !imagens.nave.error) {
            const frameWidth = imagens.nave.width;    
            const frameHeight = imagens.nave.height/5; 
            const totalFrames = 5;   
            
            const frame = teclas.w ? Math.floor(Date.now() / 150) % totalFrames : 0;
            
            ctx.drawImage(
                imagens.nave,
                0, frame * frameHeight,    
                frameWidth, frameHeight,   
                -NAVE_TAMANHO, -NAVE_TAMANHO, 
                NAVE_TAMANHO * 2, NAVE_TAMANHO * 2 
            );
        } else {
            // Fallback colorido (mantém o existente)
            ctx.strokeStyle = invencivel ? 'rgba(255, 255, 255, 0.5)' : 'white';
            ctx.fillStyle = invencivel ? 'rgba(0, 255, 255, 0.5)' : 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(NAVE_TAMANHO, 0);
            ctx.lineTo(-NAVE_TAMANHO/2, -NAVE_TAMANHO/2);
            ctx.lineTo(-NAVE_TAMANHO/2, NAVE_TAMANHO/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    } catch (e) {
        console.error('Erro ao desenhar nave:', e);
    }
    ctx.restore();
    
    // Desenhar nave inimiga (adicione antes de desenhar a UI)
    if (naveInimiga) {
        desenharNaveInimiga();
    }
    
    // Desenhar UI (pontuação e vidas)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Pontuação: ${pontuacao}`, 10, 30);
    ctx.fillText(`Vidas: ${vidas}`, 10, 60);
}

// Função para desenhar asteroides
function desenharAsteroide(asteroide) {
    ctx.save();
    ctx.translate(asteroide.x, asteroide.y);
    ctx.rotate(asteroide.rotacao);
    
    try {
        const imagem = asteroide.tipo === 'grande' ? imagens.asteroideGrande :
                      asteroide.tipo === 'medio' ? imagens.asteroideMedio :
                      imagens.asteroidePequeno;

        if (imagem && imagem.complete && !imagem.error) {
            ctx.drawImage(
                imagem,
                -asteroide.tamanho,
                -asteroide.tamanho,
                asteroide.tamanho * 2,
                asteroide.tamanho * 2
            );
        } else {
            // Fallback: desenhar círculo
            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, asteroide.tamanho, 0, Math.PI * 2);
            ctx.stroke();
        }
    } catch (e) {
        console.warn('Erro ao desenhar asteroide:', e);
    }
    
    ctx.restore();
}

// Modifiquei a função update para incluir verificação de colisões
function update() {
    if (!gameStarted) return;

    // Atualiza rotação da nave
    if (teclas.a) {
        nave.angulo -= VELOCIDADE_ROTACAO;
    }
    if (teclas.d) {
        nave.angulo += VELOCIDADE_ROTACAO;
    }

    // Atualiza movimento da nave
    if (teclas.w) {
        const angulo = nave.angulo * Math.PI / 180;
        nave.dx += Math.cos(angulo) * nave.velocidade;
        nave.dy += Math.sin(angulo) * nave.velocidade;
    }

    // Aplica movimento por inércia
    nave.x += nave.dx;
    nave.y += nave.dy;

    // Aplica um leve atrito para evitar velocidades extremas
    nave.dx *= 0.99;
    nave.dy *= 0.99;

    // Mantém nave na tela
    nave.x = (nave.x + canvas.width) % canvas.width;
    nave.y = (nave.y + canvas.height) % canvas.height;

    // Atualizar tiros
    for (let i = tiros.length - 1; i >= 0; i--) {
        tiros[i].x += tiros[i].dx;
        tiros[i].y += tiros[i].dy;
        
        // Remover tiros fora da tela
        if (tiros[i].x < 0 || tiros[i].x > canvas.width || 
            tiros[i].y < 0 || tiros[i].y > canvas.height) {
            tiros.splice(i, 1);
        }
    }

    // Atualizar asteroides
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroide = asteroids[i];
        asteroide.x += asteroide.dx;
        asteroide.y += asteroide.dy;
        asteroide.rotacao += asteroide.velocidadeRotacao;

        // Faz os asteroides atravessarem a tela como a nave
        asteroide.x = (asteroide.x + canvas.width) % canvas.width;
        asteroide.y = (asteroide.y + canvas.height) % canvas.height;
    }

    // Verifica tiro contínuo
    teclas.verificarTiro();

    // Verifica se deve spawnar novo asteroide
    if (pontuacao > 0 && pontuacao % SPAWN_CONFIG.asteroide === 0 && !ultimoPontoSpawn || 
        (ultimoPontoSpawn && pontuacao - ultimoPontoSpawn >= SPAWN_CONFIG.asteroide)) {
        asteroids.push(criarAsteroideAleatorio());
        ultimoPontoSpawn = pontuacao;
    }

    // Verifica se deve criar nave inimiga
    if (!naveInimiga && pontuacao > 0 && 
        (pontuacao - ultimoSpawnNaveInimiga >= SPAWN_CONFIG.naveInimiga || 
         (pontuacao % SPAWN_CONFIG.naveInimiga === 0 && pontuacao > ultimoSpawnNaveInimiga))) {
        console.log('Criando nova nave inimiga na pontuação:', pontuacao);
        naveInimiga = criarNaveInimiga();
        naveInimiga.dx = NAVE_INIMIGA.velocidade;
        naveInimiga.dy = NAVE_INIMIGA.velocidade;
        ultimoSpawnNaveInimiga = pontuacao;
    }

    // Atualiza nave inimiga
    if (naveInimiga) {
        // Atualiza o movimento
        naveInimiga.x += naveInimiga.dx;
        naveInimiga.y += naveInimiga.dy;
        
        // Muda direção aleatoriamente a cada 2 segundos
        if (Date.now() - naveInimiga.tempoMudancaDirecao > 2000) {
            // Escolhe uma nova direção aleatória
            let angulo = random(0, Math.PI * 2);
            naveInimiga.dx = Math.cos(angulo) * NAVE_INIMIGA.velocidade;
            naveInimiga.dy = Math.sin(angulo) * NAVE_INIMIGA.velocidade;
            naveInimiga.tempoMudancaDirecao = Date.now();
            
            // Atualiza o ângulo visual da nave
            naveInimiga.angulo = angulo;
        }
        
        // Mantém a nave na tela
        if (naveInimiga.x < 0 || naveInimiga.x > canvas.width) {
            naveInimiga.dx *= -1;
        }
        if (naveInimiga.y < 0 || naveInimiga.y > canvas.height) {
            naveInimiga.dy *= -1;
        }
        
        // Sistema de tiro mais aleatório
        if (Math.random() < naveInimiga.probabilidadeTiro) {
            atirarNaveInimiga();
        }
    }

    // Atualiza tiros inimigos
    for (let i = tirosInimigos.length - 1; i >= 0; i--) {
        const tiro = tirosInimigos[i];
        tiro.x += tiro.dx;
        tiro.y += tiro.dy;
        
        // Faz os tiros atravessarem a tela
        tiro.x = (tiro.x + canvas.width) % canvas.width;
        tiro.y = (tiro.y + canvas.height) % canvas.height;
        
        tiro.distanciaPercorrida += Math.sqrt(tiro.dx * tiro.dx + tiro.dy * tiro.dy);
        
        // Remove tiros que excederam o alcance máximo
        if (tiro.distanciaPercorrida > NAVE_INIMIGA.alcanceTiro) {
            tirosInimigos.splice(i, 1);
        }
    }
    
    // Atualiza nave inimiga para atravessar a tela
    if (naveInimiga) {
        naveInimiga.x = (naveInimiga.x + canvas.width) % canvas.width;
        naveInimiga.y = (naveInimiga.y + canvas.height) % canvas.height;
    }

    // Modifiquei a parte dos tiros da nave principal para atravessar a tela
    for (let i = tiros.length - 1; i >= 0; i--) {
        tiros[i].x = (tiros[i].x + canvas.width) % canvas.width;
        tiros[i].y = (tiros[i].y + canvas.height) % canvas.height;
        
        tiros[i].distanciaPercorrida = (tiros[i].distanciaPercorrida || 0) + 
            Math.sqrt(tiros[i].dx * tiros[i].dx + tiros[i].dy * tiros[i].dy);
        
        if (tiros[i].distanciaPercorrida > 800) { // Aumentado de 400 para 800
            tiros.splice(i, 1);
        }
    }

    verificarColisoes();
}

// Função principal do loop do jogo
function gameLoop() {
    if (!gameStarted) return;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}


function criarNaveInimiga() {
    const lado = Math.floor(Math.random() * 4);
    let x, y;

    switch(lado) {
        case 0: x = random(0, canvas.width); y = 0; break;
        case 1: x = canvas.width; y = random(0, canvas.height); break;
        case 2: x = random(0, canvas.width); y = canvas.height; break;
        case 3: x = 0; y = random(0, canvas.height); break;
    }

    return {
        x: x,
        y: y,
        dx: random(-NAVE_INIMIGA.velocidade, NAVE_INIMIGA.velocidade),
        dy: random(-NAVE_INIMIGA.velocidade, NAVE_INIMIGA.velocidade),
        angulo: random(0, Math.PI * 2),
        ultimoTiro: 0,
        raio: NAVE_INIMIGA.tamanho / 2,
        tempoMudancaDirecao: 0,
        probabilidadeTiro: 0.02 
    };
}

function atirarNaveInimiga() {
    if (!naveInimiga) return;
    
    const agora = Date.now();
    if (agora - naveInimiga.ultimoTiro >= NAVE_INIMIGA.delayTiro) {
        // Calcula ângulo em direção ao jogador
        const anguloParaJogador = Math.atan2(
            nave.y - naveInimiga.y,
            nave.x - naveInimiga.x
        );
        
        // Adiciona uma variação aleatória ao ângulo (-30 a +30 graus)
        const variacao = random(-Math.PI/6, Math.PI/6);
        const anguloFinal = anguloParaJogador + variacao;
        
        tirosInimigos.push({
            x: naveInimiga.x,
            y: naveInimiga.y,
            dx: Math.cos(anguloFinal) * NAVE_INIMIGA.velocidadeTiro,
            dy: Math.sin(anguloFinal) * NAVE_INIMIGA.velocidadeTiro,
            distanciaPercorrida: 0,
            raio: 3
        });
        
        naveInimiga.ultimoTiro = agora;
        naveInimiga.probabilidadeTiro = 0.05;
    }
}

const SPAWN_CONFIG = {
    asteroide: 150,  // Spawn de asteroide a cada 150 pontos
    naveInimiga: 350 // Spawn de nave inimiga a cada 350 pontos
};

function desenharNaveInimiga() {
    if (!naveInimiga) return;
    
    ctx.save();
    ctx.translate(naveInimiga.x, naveInimiga.y);
    ctx.rotate(naveInimiga.angulo);
    
    try {
        if (imagens.naveInimiga && imagens.naveInimiga.complete && !imagens.naveInimiga.error) {
            ctx.drawImage(
                imagens.naveInimiga,
                -NAVE_INIMIGA.tamanho,
                -NAVE_INIMIGA.tamanho,
                NAVE_INIMIGA.tamanho * 2,
                NAVE_INIMIGA.tamanho * 2
            );
        } else {
            // Fallback para nave inimiga
            ctx.strokeStyle = 'red';
            ctx.fillStyle = 'darkred';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(NAVE_INIMIGA.tamanho, 0);
            ctx.lineTo(-NAVE_INIMIGA.tamanho/2, -NAVE_INIMIGA.tamanho/2);
            ctx.lineTo(-NAVE_INIMIGA.tamanho/2, NAVE_INIMIGA.tamanho/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    } catch (e) {
        console.warn('Erro ao desenhar nave inimiga:', e);
    }
    
    ctx.restore();
}
