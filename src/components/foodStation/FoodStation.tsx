import { useEffect, useState } from 'react';
import API from '../../utils/API'; // ajusta la ruta según dónde esté tu archivo `API.ts`
import { MdDinnerDining } from "react-icons/md";

const FoodStation = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [options, setOptions] = useState<Record<number, DishOptions>>({});
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  useEffect(() => {
    API.get<DishResponse>('api/foodstation/dishes/')
      .then(res => {
        setDishes(res.data.results);
        // console.log('✅ Platos obtenidos:', res.data.results);
      })
      .catch(err => console.error('❌ Error al obtener platos:', err));
  }, []);

  const handleOrder = (dishId: number) => {
  const { quantity, notes, variationId } = options[dishId] || { quantity: 1, notes: '' };
    if (quantity <= 0) {
      alert("⚠️ La cantidad debe ser al menos 1");
      return;
    }
    API.post('/api/foodstation/orders/', {
      dish: dishId,
      quantity,
      notes,
      variations: variationId ? [variationId] : undefined,
    })
      .then(() => alert("✅ Pedido enviado"))
      .catch(err => {
        console.error("❌ Error al enviar pedido:", err);
        alert("⚠️ Error al enviar pedido");
      });
  };

  const handleOptionChange = 
            (dishId: number, 
            field: 'quantity' | 'notes' | 'variationId',
            value: string | number) => {
    setOptions(prev => ({
      ...prev,
      [dishId]: {
        ...prev[dishId],
        [field]: field === 'quantity' || field === 'variationId' ? Number(value) : value
      }
    }));
  };


  return (
    <>
    {selectedDish && (
    <div className="transition ease-out duration-300 transform scale-95 fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative ">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={() => setSelectedDish(null)}
        >
          ✖️
        </button>
        <h3 className="text-2xl font-bold mb-4 text-center">{selectedDish.name}</h3>

        <label className="block text-sm font-medium text-gray-700 mt-4 text-center">Cantidad</label>
        <div className="flex items-center gap-2 mt-1 justify-center">
          <button
            onClick={() =>
              handleOptionChange(
                selectedDish.id,
                'quantity',
                Math.max(1, (options[selectedDish.id]?.quantity ?? 1) - 1)
              )
            }
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
          >
            -
          </button>
          <span className="px-4 text-lg">{options[selectedDish.id]?.quantity ?? 1}</span>
          <button
            onClick={() =>
              handleOptionChange(
                selectedDish.id,
                'quantity',
                (options[selectedDish.id]?.quantity ?? 1) + 1
              )
            }
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
          >
            +
          </button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mt-4">Elige una opción</label>
        <select
          value={options[selectedDish.id]?.variationId ?? ''}
          onChange={e =>
            handleOptionChange(selectedDish.id, 'variationId', Number(e.target.value))
          }
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
        >
          <option value="">-- Selecciona una opción --</option>
          {selectedDish.variations?.map((variation: any) => (
            <option key={variation.id} value={variation.id}>
              {variation.name} {variation.extra_price > 0 && `(+ $${variation.extra_price})`}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium text-gray-700 mt-4">Notas (ej: sin salsa, extra picante...)</label>
        <textarea
          value={options[selectedDish.id]?.notes ?? ''}
          onChange={e =>
            handleOptionChange(selectedDish.id, 'notes', e.target.value)
          }
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
        />

        <button
          onClick={() => {
            handleOrder(selectedDish.id);
            setSelectedDish(null);
          }}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md font-semibold disabled:opacity-50"
          disabled={(selectedDish.variations?.length ?? 0) > 0 && !options[selectedDish.id]?.variationId}
        >
          🛒 Confirmar pedido
        </button>
      </div>
    </div>
  )}
    <div className="p-6">
      <h2 className='text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-t from-gray-500 to-purple-600 mb-8 pb-2 border-y-4 rounded-lg border-gray-600 tracking-tight text-center'>
        <MdDinnerDining className='inline-block text-red-50 items-center' size={40} />
        Food Station
      </h2>

      {dishes.length === 0 ? (
        <p className="text-center text-gray-500">No hay platillos disponibles aún.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-white max-h-[90vh] border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={dish.image_url || 'https://via.placeholder.com/400x200?text=Imagen+no+disponible'}
                alt={dish.name}
                className="w-full max-h-[550px] object-cover"
              />

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{dish.name}</h3>
                <p className="text-sm text-gray-500 mb-2">👨‍🍳 {dish.vendor_name}</p>
                <p className="text-sm text-gray-500 mb-2">
                  🗓️ {Array.isArray(dish.available_days)
                    ? dish.available_days.join(', ')
                    : dish.available_days}
                </p>
                <p className="text-gray-700 text-sm">{dish.description}</p>
                {dish.variations && dish.variations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 font-semibold">Variaciones disponibles:</p>
                    <ul className="text-sm text-gray-700 list-disc ml-5">
                      {dish.variations.map((v) => (
                        <li key={v.id}>
                          {v.name}
                          {Number(v.extra_price) > 0 && ` (+$${v.extra_price})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-2">🕒 {dish.start_time} - {dish.end_time}</p>
              <div className="p-4 flex flex-col items-center bg-gray-300 rounded-b-xl">
                <p className="text-green-600 font-bold my-2 text-2xl">${dish.price}</p>
                <button
                  onClick={() => setSelectedDish(dish)}
                  className="items-center mt-4 max-w-[500px] bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  🛒 Hacer pedido
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  </>
  );
};

export default FoodStation;