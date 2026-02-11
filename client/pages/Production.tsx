import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Play, Pause, Plus } from "lucide-react";
import { useState } from "react";

const Production = () => {
  const [selectedRecipe, setSelectedRecipe] = useState(1);
  const [isProducing, setIsProducing] = useState(false);
  const [productionProgress, setProductionProgress] = useState(65);

  const recipes = [
    {
      id: 1,
      name: "Gaming Desktop PC",
      components: ["CPU", "Motherboard", "RAM", "SSD", "GPU", "Power Supply"],
      cost: 1200,
      duration: "4 hours",
      quantity: 50,
    },
    {
      id: 2,
      name: "Office Workstation",
      components: ["CPU", "Motherboard", "RAM", "SSD", "Power Supply"],
      cost: 750,
      duration: "3 hours",
      quantity: 30,
    },
    {
      id: 3,
      name: "Server Build",
      components: ["CPU x2", "Motherboard", "RAM x4", "SSD x2", "Power Supply"],
      cost: 3200,
      duration: "5 hours",
      quantity: 10,
    },
  ];

  const materialUsage = [
    { name: "CPU", planned: 50, used: 32, unit: "dona" },
    { name: "Motherboard", planned: 50, used: 32, unit: "dona" },
    { name: "RAM", planned: 100, used: 65, unit: "dona" },
    { name: "SSD", planned: 50, used: 32, unit: "dona" },
    { name: "GPU", planned: 25, used: 18, unit: "dona" },
    { name: "Power Supply", planned: 50, used: 32, unit: "dona" },
  ];

  const currentRecipe = recipes.find((r) => r.id === selectedRecipe);

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ishlab chiqarish</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Ishlab chiqarish jarayoni va retseptalari boshqaring
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
            <Plus className="h-4 w-4" />
            Yangi retsept
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recipe List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Retseptlar</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe.id)}
                  className={`w-full text-left p-4 rounded-md border transition-all ${
                    selectedRecipe === recipe.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Narx: ${recipe.cost}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {recipe.components.length} komponent
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Center/Right: Production Details */}
          <div className="lg:col-span-2 space-y-6">
            {currentRecipe && (
              <>
                {/* Recipe Details */}
                <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {currentRecipe.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Vaqti: {currentRecipe.duration} | Narxi: ${currentRecipe.cost}
                      </p>
                    </div>
                  </div>

                  {/* Components List */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Komponentlar ({currentRecipe.components.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {currentRecipe.components.map((comp, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 px-3 py-2 text-center"
                        >
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            {comp}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Production Control */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      Ishlab chiqarish
                    </h3>
                    <div className="flex gap-3 mb-4">
                      <Button
                        onClick={() => setIsProducing(!isProducing)}
                        className={`flex-1 rounded-md gap-2 ${
                          isProducing
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white`}
                      >
                        {isProducing ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Pauza
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Boshlash
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                      >
                        Reset
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Tayyorlanmoqda
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {productionProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-md h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-md transition-all ${
                            isProducing ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
                          }`}
                          style={{ width: `${productionProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentRecipe.quantity} birlik / Qolgan: {Math.ceil((100 - productionProgress) * currentRecipe.quantity / 100)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material Usage Table */}
                <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Xomashyo foydalanish
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Xomashyo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Rejada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Foydalanilgan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Qoldiq
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialUsage.map((material, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 text-sm font-medium">
                              {material.name}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {material.planned} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {material.used} {material.unit}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {material.planned - material.used} {material.unit}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Production;
