export const themeUtils = {
    applyDarkMode: (isDark) => {
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('darkMode', isDark.toString());
    },

    applyColorBlindMode: (isColorBlind) => {
        document.documentElement.classList.toggle('color-blind-mode', isColorBlind);
        localStorage.setItem('colorBlindMode', isColorBlind.toString());
    },

    initializeTheme: () => {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        const colorBlindMode = localStorage.getItem('colorBlindMode') === 'true';

        if (darkMode) document.documentElement.classList.add('dark-mode');
        if (colorBlindMode) document.documentElement.classList.add('color-blind-mode');

        return { darkMode, colorBlindMode };
    }
};