// Must be imported before prismjs, which reads it on load: stops Prism from highlighting the whole page itself
window.Prism = { ...window.Prism, manual: true };
