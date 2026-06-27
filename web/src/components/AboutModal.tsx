interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-slate-800 dark:text-slate-100 font-bold text-xl">À propos du NORDIQ-20</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
          <section>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Qu'est-ce que le NORDIQ-20 ?</h3>
            <p>Le NORDIQ-20 est un indice boursier pancanadien expérimental regroupant 19 sociétés canadiennes sélectionnées pour leur qualité et leur représentativité sectorielle. Il est calculé selon la méthode du diviseur, standard des grands indices mondiaux.</p>
          </section>

          <section>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Méthode de calcul</h3>
            <p className="mb-2">La valeur de l'indice est calculée selon la formule :</p>
            <code className="block bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-blue-600 dark:text-blue-300 text-xs">
              NORDIQ-20(t) = ( Σ q_i × P_i(t) ) / D
            </code>
            <ul className="mt-2 space-y-1 list-disc list-inside text-slate-500 dark:text-slate-400">
              <li><span className="text-slate-700 dark:text-slate-300">q_i</span> — nombre d'unités du titre i (calculé à t0)</li>
              <li><span className="text-slate-700 dark:text-slate-300">P_i(t)</span> — cours de clôture du titre i à la date t</li>
              <li><span className="text-slate-700 dark:text-slate-300">D</span> — diviseur fixé à l'initialisation pour que l'indice vaille 1 000 pts à t0</li>
            </ul>
          </section>

          <section>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">PR vs TR</h3>
            <ul className="space-y-1 list-disc list-inside text-slate-500 dark:text-slate-400">
              <li><span className="text-slate-700 dark:text-slate-300">PR (Price Return)</span> — variation des cours boursiers uniquement</li>
              <li><span className="text-slate-700 dark:text-slate-300">TR (Total Return)</span> — cours + dividendes réinvestis (via cours ajustés)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Date de référence (t0)</h3>
            <p>L'indice a été initialisé le <span className="text-slate-800 dark:text-slate-100">4 janvier 2022</span> à une valeur de base de <span className="text-slate-800 dark:text-slate-100">1 000 points</span>.</p>
          </section>

          <section>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Source des données</h3>
            <p>Les données de marché proviennent de <span className="text-slate-800 dark:text-slate-100">yahoo-finance2</span>, une bibliothèque open source non officielle et non affiliée à Yahoo Finance. Usage à des fins personnelles uniquement.</p>
          </section>

          <section className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p className="text-slate-400 dark:text-slate-500 text-xs">⚠ Le NORDIQ-20 est un indice expérimental à titre éducatif uniquement. Il ne constitue pas un conseil de placement. Les performances passées ne garantissent pas les résultats futurs.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
