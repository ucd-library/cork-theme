/**
 * @file Utility functions for laying out content with campus's layout classes, such as l-2col.
 */

/**
 * @description Groups items into rows of 2, 3 or 4 columns, with the campus layout class for each row and column,
 * e.g. for rendering a list of cards in a grid.
 * @param {Array} items - The items to lay out, in order.
 * @param {Number} columnCount - Columns per row: 2, 3 or 4. Other numbers are rounded and clamped to that range, and a non-number gives the default. Default: 2
 * @returns {GridRow[]}
 *
 * @example
 * import { toGridRows } from '@ucd-lib/cork-theme/utils/layout';
 *
 * // in a Lit template
 * ${toGridRows(this.cards, 3).map(row => html`
 *   <div class=${row.class}>
 *     ${row.columns.map(column => html`
 *       <div class=${column.class}>${column.item.title}</div>
 *     `)}
 *   </div>
 * `)}
 */
export function toGridRows(items, columnCount=2) {
  const rowClasses = [
    {class: 'l-2col', count: 2},
    {class: 'l-3col', count: 3},
    {class: 'l-4col', count: 4}
  ];
  const columnClasses = [
    'l-first',
    'l-second',
    'l-third',
    'l-fourth'
  ];

  // only 2-4 columns have layout classes, so clamp, rather than throw in the middle of a render
  const count = Math.min(4, Math.max(2, Math.round(Number(columnCount)) || 2));
  const rowClass = rowClasses.find(r => r.count === count).class;

  return items.reduce((acc, item, currentIndex) => {
    const index = Math.floor(currentIndex / count);
    if( !acc[index] ) {
      acc[index] = {
        class: rowClass,
        isFirstRow: index === 0,
        isLastRow: index === Math.ceil(items.length / count) - 1,
        columns: []
      };
    }
    acc[index].columns.push({
      class: columnClasses[currentIndex % count],
      item
    });
    return acc;
  }, []);
};

/**
 * @typedef {Object} GridRow
 * @description A row from toGridRows.
 * @property {String} class - The row's layout class: l-2col, l-3col or l-4col.
 * @property {Boolean} isFirstRow - Whether it's the first row.
 * @property {Boolean} isLastRow - Whether it's the last row.
 * @property {GridColumn[]} columns - The row's columns, in order. The last row may have fewer than the others.
 */

/**
 * @typedef {Object} GridColumn
 * @description A column in a GridRow.
 * @property {String} class - The column's position class: l-first, l-second, l-third or l-fourth.
 * @property {*} item - The item from the array passed to toGridRows.
 */
