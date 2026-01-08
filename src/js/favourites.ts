import { categories } from './config/tools.js';
import { createIcons, icons } from 'lucide';

const FAVOURITES_KEY = 'bentopdf-favourites';
const SECTION_STATE_KEY = 'bentopdf-section-states';

interface Tool {
  href: string;
  name: string;
  icon: string;
  subtitle: string;
}

interface SectionStates {
  [key: string]: boolean;
}

// Get favourites from localStorage
export const getFavourites = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save favourites to localStorage
export const saveFavourites = (favourites: string[]): void => {
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
};

// Add tool to favourites
export const addToFavourites = (toolHref: string): void => {
  const favourites = getFavourites();
  if (!favourites.includes(toolHref)) {
    favourites.push(toolHref);
    saveFavourites(favourites);
  }
};

// Remove tool from favourites
export const removeFromFavourites = (toolHref: string): void => {
  const favourites = getFavourites().filter((href) => href !== toolHref);
  saveFavourites(favourites);
};

// Check if tool is favourite
export const isFavourite = (toolHref: string): boolean => {
  return getFavourites().includes(toolHref);
};

// Get section states from localStorage
export const getSectionStates = (): SectionStates => {
  try {
    const stored = localStorage.getItem(SECTION_STATE_KEY);
    if (!stored) {
      return { favourites: true, popularTools: true };
    }

    const parsed = JSON.parse(stored) as SectionStates;

    if (!parsed || typeof parsed !== 'object') {
      return { favourites: true, popularTools: true };
    }

    if (parsed.favourites === undefined) parsed.favourites = true;
    if (parsed.popularTools === undefined) parsed.popularTools = true;

    return parsed;
  } catch {
    return { favourites: true, popularTools: true };
  }
};

// Save section states to localStorage
export const saveSectionStates = (states: SectionStates): void => {
  localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(states));
};

// Get all tools as a flat array
export const getAllTools = (): Tool[] => {
  const tools: Tool[] = [];
  categories.forEach((category) => {
    category.tools.forEach((tool) => {
      tools.push(tool as Tool);
    });
  });
  return tools;
};

// Get tool by href
export const getToolByHref = (href: string): Tool | undefined => {
  return getAllTools().find((tool) => tool.href === href);
};

// Create favourite button for tool card
export const createFavouriteButton = (
  toolHref: string,
  onToggle: () => void
): HTMLButtonElement => {
  const btn = document.createElement('button');
  btn.className =
    'favourite-btn absolute top-2 right-2 p-1.5 rounded-full bg-gray-700/80 hover:bg-gray-600 transition-colors z-10';
  btn.title = isFavourite(toolHref)
    ? 'Usuń z ulubionych'
    : 'Dodaj do ulubionych';

  const updateIcon = () => {
    const isFav = isFavourite(toolHref);
    btn.innerHTML = isFav
      ? '<svg class="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
      : '<svg class="w-4 h-4 text-gray-400 hover:text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
    btn.title = isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych';
  };

  updateIcon();

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavourite(toolHref)) {
      removeFromFavourites(toolHref);
    } else {
      addToFavourites(toolHref);
    }

    updateIcon();
    onToggle();
  });

  return btn;
};

// Create section header with fold/unfold functionality
export const createSectionHeader = (
  title: string,
  sectionKey: string,
  onToggle: (isExpanded: boolean) => void
): HTMLDivElement => {
  const header = document.createElement('div');
  header.className =
    'flex items-center justify-between cursor-pointer group mb-4 mt-8 first:mt-0';

  const states = getSectionStates();
  const isExpanded = states[sectionKey] !== false;

  const titleEl = document.createElement('h2');
  titleEl.className =
    'text-xl font-bold text-indigo-400 text-white flex items-center gap-2';
  titleEl.innerHTML = `
    <svg class="w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
    ${title}
  `;

  header.appendChild(titleEl);

  header.addEventListener('click', () => {
    const currentStates = getSectionStates();
    const current = currentStates[sectionKey] !== false;
    const newExpanded = !current;
    currentStates[sectionKey] = newExpanded;
    saveSectionStates(currentStates);

    const arrow = titleEl.querySelector('svg');
    if (arrow) {
      arrow.classList.toggle('rotate-0', newExpanded);
      arrow.classList.toggle('-rotate-90', !newExpanded);
    }

    onToggle(newExpanded);
  });

  return header;
};

// Initialize favourites system
export const initFavourites = (
  toolGrid: HTMLElement,
  t: (key: string) => string,
  toolTranslationKeys: Record<string, string>,
  categoryTranslationKeys: Record<string, string>
): void => {
  const renderToolGrid = () => {
    toolGrid.textContent = '';

    const favourites = getFavourites();
    const states = getSectionStates();

    // Render Favourites section if there are any
    if (favourites.length > 0) {
      const favouritesGroup = document.createElement('div');
      favouritesGroup.className = 'category-group col-span-full';
      favouritesGroup.id = 'favourites-section';

      const favouritesContainer = document.createElement('div');
      favouritesContainer.className =
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';
      favouritesContainer.style.display = states.favourites ? 'grid' : 'none';

      const header = createSectionHeader(
        t('tools:categories.favourites') || 'Ulubione',
        'favourites',
        (isExpanded) => {
          favouritesContainer.style.display = isExpanded ? 'grid' : 'none';
        }
      );

      favourites.forEach((href) => {
        const tool = getToolByHref(href);
        if (tool) {
          const card = createToolCard(
            tool,
            t,
            toolTranslationKeys,
            renderToolGrid
          );
          favouritesContainer.appendChild(card);
        }
      });

      favouritesGroup.append(header, favouritesContainer);
      toolGrid.appendChild(favouritesGroup);
    }

    // Render categories
    categories.forEach((category, index) => {
      const categoryGroup = document.createElement('div');
      categoryGroup.className = 'category-group col-span-full';

      const toolsContainer = document.createElement('div');
      toolsContainer.className =
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';

      // For Popular Tools, add foldable header and filter out favourites
      if (index === 0) {
        toolsContainer.style.display =
          states.popularTools !== false ? 'grid' : 'none';

        const header = createSectionHeader(
          t(categoryTranslationKeys[category.name]) || category.name,
          'popularTools',
          (isExpanded) => {
            toolsContainer.style.display = isExpanded ? 'grid' : 'none';
          }
        );

        category.tools.forEach((tool) => {
          // Skip tools that are in favourites
          if (!favourites.includes(tool.href)) {
            const card = createToolCard(
              tool as Tool,
              t,
              toolTranslationKeys,
              renderToolGrid
            );
            toolsContainer.appendChild(card);
          }
        });

        categoryGroup.append(header, toolsContainer);
      } else {
        const sectionKey = `category:${category.name}`;
        const isExpanded = states[sectionKey] !== false;

        toolsContainer.style.display = isExpanded ? 'grid' : 'none';

        const categoryKey = categoryTranslationKeys[category.name];
        const titleText = categoryKey ? t(categoryKey) : category.name;

        const header = createSectionHeader(
          titleText,
          sectionKey,
          (expanded) => {
            toolsContainer.style.display = expanded ? 'grid' : 'none';
          }
        );

        category.tools.forEach((tool) => {
          const card = createToolCard(
            tool as Tool,
            t,
            toolTranslationKeys,
            renderToolGrid
          );
          toolsContainer.appendChild(card);
        });

        categoryGroup.append(header, toolsContainer);
      }

      toolGrid.appendChild(categoryGroup);
    });

    // Add search results container
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'search-results';
    searchResultsContainer.className =
      'hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 col-span-full';
    toolGrid.insertBefore(searchResultsContainer, toolGrid.firstChild);

    createIcons({ icons });
  };

  renderToolGrid();

  // Return render function for search to use
  (window as any).__renderToolGrid = renderToolGrid;
};

// Create tool card with favourite button
const createToolCard = (
  tool: Tool,
  t: (key: string) => string,
  toolTranslationKeys: Record<string, string>,
  onFavouriteToggle: () => void
): HTMLAnchorElement => {
  const toolCard = document.createElement('a');
  toolCard.href = tool.href;
  toolCard.className =
    'tool-card relative block bg-gray-800 rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center text-center no-underline hover:shadow-lg transition duration-200';

  const favBtn = createFavouriteButton(tool.href, onFavouriteToggle);
  toolCard.appendChild(favBtn);

  const icon = document.createElement('i');
  icon.className = 'w-10 h-10 mb-3 text-indigo-400';

  if (tool.icon.startsWith('ph-')) {
    icon.className = `ph ${tool.icon} text-4xl mb-3 text-indigo-400`;
  } else {
    icon.setAttribute('data-lucide', tool.icon);
  }

  const toolName = document.createElement('h3');
  toolName.className = 'font-semibold text-white';
  const toolKey = toolTranslationKeys[tool.name];
  toolName.textContent = toolKey ? t(`${toolKey}.name`) : tool.name;

  toolCard.append(icon, toolName);

  if (tool.subtitle) {
    const toolSubtitle = document.createElement('p');
    toolSubtitle.className = 'text-xs text-gray-400 mt-1 px-2';
    toolSubtitle.textContent = toolKey
      ? t(`${toolKey}.subtitle`)
      : tool.subtitle;
    toolCard.appendChild(toolSubtitle);
  }

  return toolCard;
};
