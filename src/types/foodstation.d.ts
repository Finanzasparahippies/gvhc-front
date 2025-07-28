
type Dish = {
    id: number;
    name: string; // Nombre del plato
    vendor_name: string; // Nombre del vendedor
    description: string; // Descripción del plato
    variations?: Variation[]; // Variaciones del plato (opcional)
    price: number; // Precio del plato
    image_url?: string; // URL de la imagen del plato (opcional)
    available_days?: string[]; // Días de la semana en que está disponible (opcional)
    category?: string; // Categoría del plato (opcional)
    start_time?: string; // Hora de inicio de disponibilidad (opcional)
    end_time?: string; // Hora de fin de disponibilidad (opcional)
};

interface DishResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Dish[];
}

type DishOptions = {
    quantity: number;
    notes: string;
    variationId?: number; // solo una variación seleccionada
    variations?: string[]; // múltiples variaciones seleccionadas
};

type Variation = {
    id: number;
    name: string;
    extra_price: string | number;
};

