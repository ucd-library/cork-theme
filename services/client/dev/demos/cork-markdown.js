import '@ucd-lib/cork-theme/elements/cork-markdown';

// The script fills the markdown property, which would otherwise show up in the snippet as an attribute too
export const hiddenKnobs = ['markdown'];

// Starting markup for the cork-markdown demo
export default `
<cork-markdown>
  <script type="text/markdown">
    ## A heading
    Some **bold** text, and a link: <https://library.ucdavis.edu>

    1. First
    2. Second
       1. Nested

    | Format | Loan period |
    | --- | --- |
    | Books | 4 weeks |
    | DVDs | 1 week |
  </script>
</cork-markdown>
`;
