
const slidesToElements = (faqId, slides) => {
    const nodes = [];
    const edges = [];

    const slideMap = slides.reduce((map, slide) => {
        map[slide.id] = slide;
        return map;
    }, {});

    slides.forEach((slide) => {
        const nodeId = `faq-${faqId}-slide-${slide.id}`;
        nodes.push({
        id: nodeId,
        type: 'Slide',
        position: { x: 0, y: 0 }, // La posición se ajustará después
        data: { ...slide },
        });

        const directions = ['left', 'right', 'up', 'down'];
        directions.forEach((dir) => {
        if (slide[dir]) {
            const targetSlideId = `faq-${faqId}-slide-${slide[dir]}`;
            edges.push({
            id: `${nodeId}->${targetSlideId}`,
            source: nodeId,
            target: targetSlideId,
            type: 'smoothstep',
            });
        }
        });
    });

    return { nodes, edges };
};

export default slidesToElements;
