---
title: "Land Platform: del terreno a la oferta en una sola pantalla"
seoTitle: "Land Platform: Del Terreno a la Oferta | Sondri"
seoDescription: "Cómo Sondri construyó un espacio de trabajo para adquisición de terrenos con mapa satelital, valuación con comparables, dos ofertas y chat de equipo."
excerpt: "Quienes compran terrenos pierden días en una sola pregunta: ¿cuánto ofrecer? Land Platform mapea la parcela, calcula el precio desde ventas comparables y redacta dos ofertas lado a lado. Qué hace hoy el piloto y qué sigue."
category: "Soluciones"
date: 2026-10-10
updated: 2026-11-18
author: "Sondri"
solution: land-platform
draft: false
---

Un equipo de adquisición de terrenos repite siempre los mismos cinco pasos: encontrar una parcela, evaluarla, fijar el precio, presentar una oferta y entregarla a quien cierra la venta. La mayoría realiza esos pasos repartidos entre una app de mapas, una hoja de cálculo, criterio intuitivo y un chat grupal que nunca se detiene.

Land Platform es el piloto que construimos para reunir los cuatro primeros pasos en un solo lugar. Este artículo explica qué hace hoy, las decisiones de diseño detrás y los próximos pasos.

## El problema

Tres cuellos de botella frenan a un equipo de tierras, y ninguno es falta de oportunidades.

**Fijar el precio es el freno principal.** Decidir cuánto ofrecer es el paso más difícil tanto para compradores nuevos como expertos. Quien recién entra no puede avanzar hasta que alguien senior revisa la operación, así que cada trato queda esperando en la misma fila.

**El trabajo está disperso en pestañas.** Un mapa en una ventana, registros del condado en otra, ventas comparables en Excel y la plantilla de oferta en un documento. Cada terreno exige volver a unir las piezas.

**Se repiten las mismas preguntas todo el día.** El equipo trabaja en horarios distintos. Alguien pregunta por un levantamiento o la última oferta de una parcela, todos reciben la notificación y la respuesta ya estaba en el hilo de ayer.

## Qué construimos

### Un solo mapa para trabajar

El mapa es la pantalla inicial. Abre sobre imagen satelital con cada parcela marcada y coloreada por prioridad.

- Búsqueda por propietario, dirección, número de parcela o por voz.
- Dibujo de polígonos para medir hectáreas o distancia entre dos puntos.
- Ficha completa de parcela con zona inundable, curvas de nivel, construcciones y notas del equipo.

### Un precio verificable

Al seleccionar un terreno, Land Platform estima su valor partiendo del avalúo fiscal y combinándolo con ventas comparables cercanas, ponderadas por distancia, orientación y similitud.

El estimado nunca aparece solo: los comparables se muestran en tabla debajo con distancia, orientación, precio y similitud junto a un índice de confianza.

### Dos ofertas desde un cálculo

Land Platform convierte el estimado en dos propuestas en paralelo:

1. **Al contado**, a un porcentaje definido del valor estimado.
2. **Financiamiento del vendedor**, a mayor precio con pago inicial bajo, sin interés y plazo fijo.

El comprador ajusta condiciones antes de imprimir. El documento no se genera hasta confirmar los términos con una casilla, e imprime una carta de intención con arras, plazo de inspección y fecha de cierre completados.

### El equipo en un mismo lugar

Canales, canales privados, mensajes directos y contadores de no leídos conviven junto a cada operación en tiempo real. El acceso es solo por invitación, con roles separados para administración, adquisiciones, ventas y asistentes.

## Las decisiones detrás

**El comprador confirma toda oferta antes de imprimir.** Land Platform hace el cálculo y prepara el borrador; una persona valida los términos antes de emitir el documento.

**Cada número muestra cómo se calculó.** Los compradores confían en un precio cuando ven los comparables y el puntaje de confianza justo al lado.

**Validar el flujo antes de escalar datos.** El piloto corre sobre un mercado de muestra fijo para probar todo el recorrido antes de contratar datos en vivo a gran escala.

**El acceso es una decisión del negocio.** Nadie se registra por su cuenta: un administrador invita a cada miembro y asigna su rol.

## Qué sigue

El piloto valida la pantalla operativa. Las siguientes etapas convierten la herramienta en el sistema central del equipo:

- **Datos vivos de parcelas**, con límites trazados en todo el estado al navegar el mapa.
- **Historial guardado** de cada valuación y oferta, exigiendo motivo ante ajustes manuales.
- **Priorización geográfica** mediante bandas de mercado configuradas según reglas del negocio.
- **Traspaso directo a ventas** con seguimiento hasta la firma.
- **Chat más silencioso**, con un asistente que responde dudas repetidas usando los datos de la operación.
- **Reglas configurables**, para modificar porcentajes y plazos sin liberar código nuevo.

## Dónde aplica este patrón

Este flujo va más allá de los bienes raíces. Cualquier equipo que investiga, cotiza y envía ofertas sufre los mismos tres problemas: un especialista saturado, datos dispersos y chats ruidosos. Si ese es el caso de su equipo, agende una sesión de diagnóstico y revisamos si podemos ayudar.
