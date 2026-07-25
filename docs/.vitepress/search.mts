import type { DefaultTheme } from 'vitepress';

export const searchConfig = {
  provider: 'local',
  options: {
    detailedView: 'auto',
    disableQueryPersistence: false,
    locales: {
      root: {
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation',
          },
          modal: {
            displayDetails: 'Display detailed list',
            resetButtonTitle: 'Reset search',
            backButtonTitle: 'Close search',
            noResultsText: 'No results for',
            footer: {
              selectText: 'to select',
              selectKeyAriaLabel: 'enter',
              navigateText: 'to navigate',
              navigateUpKeyAriaLabel: 'up arrow',
              navigateDownKeyAriaLabel: 'down arrow',
              closeText: 'to close',
              closeKeyAriaLabel: 'escape',
            },
          },
        },
      },
      zh: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '重置搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '导航',
              navigateUpKeyAriaLabel: '向上箭头',
              navigateDownKeyAriaLabel: '向下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Escape 键',
            },
          },
        },
      },
      es: {
        translations: {
          button: {
            buttonText: 'Buscar',
            buttonAriaLabel: 'Buscar en la documentación',
          },
          modal: {
            displayDetails: 'Mostrar la lista detallada',
            resetButtonTitle: 'Restablecer la búsqueda',
            backButtonTitle: 'Cerrar la búsqueda',
            noResultsText: 'No hay resultados para',
            footer: {
              selectText: 'para seleccionar',
              selectKeyAriaLabel: 'Intro',
              navigateText: 'para navegar',
              navigateUpKeyAriaLabel: 'flecha hacia arriba',
              navigateDownKeyAriaLabel: 'flecha hacia abajo',
              closeText: 'para cerrar',
              closeKeyAriaLabel: 'Escape',
            },
          },
        },
      },
      fr: {
        translations: {
          button: {
            buttonText: 'Rechercher',
            buttonAriaLabel: 'Rechercher dans la documentation',
          },
          modal: {
            displayDetails: 'Afficher la liste détaillée',
            resetButtonTitle: 'Réinitialiser la recherche',
            backButtonTitle: 'Fermer la recherche',
            noResultsText: 'Aucun résultat pour',
            footer: {
              selectText: 'pour sélectionner',
              selectKeyAriaLabel: 'entrée',
              navigateText: 'pour naviguer',
              navigateUpKeyAriaLabel: 'flèche vers le haut',
              navigateDownKeyAriaLabel: 'flèche vers le bas',
              closeText: 'pour fermer',
              closeKeyAriaLabel: 'échap',
            },
          },
        },
      },
    },
  },
} satisfies DefaultTheme.Config['search'];
