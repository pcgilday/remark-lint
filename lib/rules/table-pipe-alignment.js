/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module table-pipe-alignment
 * @fileoverview
 *   Warn when table pipes are not aligned.
 * @example
 *   <!-- Valid: -->
 *   | A     | B     |
 *   | ----- | ----- |
 *   | Alpha | Bravo |
 *
 *   <!-- Invalid: -->
 *   | A | B |
 *   | -- | -- |
 *   | Alpha | Bravo |
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var visit = require('unist-util-visit');
var position = require('mdast-util-position');

/*
 * Methods.
 */

var start = position.start;
var end = position.end;

/**
 * Warn when table pipes are not aligned.
 *
 * @param {Node} ast - Root node.
 * @param {File} file - Virtual file.
 * @param {*} preferred - Ignored.
 * @param {Function} done - Callback.
 */
function tablePipeAlignment(ast, file, preferred, done) {
    visit(ast, 'table', function (node) {
        var contents = file.toString();
        var indices = [];
        var offset;
        var line;

        if (position.generated(node)) {
            return;
        }

        /**
         * Check all pipes after each column are at
         * aligned.
         *
         * @param {number} initial - Starting index.
         * @param {number} final - Closing index.
         * @param {number} index - Position of cell in
         *   its parent.
         */
        function check(initial, final, index) {
            var pos = initial + contents.slice(initial, final).indexOf('|') - offset + 1;

            if (indices[index] === undefined || indices[index] === null) {
                indices[index] = pos;
            } else if (pos !== indices[index]) {
                file.warn('Misaligned table fence', {
                    'start': {
                        'line': line,
                        'column': pos
                    },
                    'end': {
                        'line': line,
                        'column': pos + 1
                    }
                });
            }
        }

        node.children.forEach(function (row) {
            var cells = row.children;

            line = start(row).line;
            offset = start(row).offset;

            check(start(row).offset, start(cells[0]).offset, 0);

            row.children.forEach(function (cell, index) {
                var next = start(cells[index + 1]).offset || end(row).offset;

                check(end(cell).offset, next, index + 1);
            });
        });
    });

    done();
}

/*
 * Expose.
 */

module.exports = tablePipeAlignment;
