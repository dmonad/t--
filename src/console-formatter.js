import base from '../node_modules/jsondiffpatch/src/formatters/base.js'

var BaseFormatter = base.BaseFormatter

var colors = {
  added: 'color:green',
  deleted: 'color:red',
  movedestination: 'color:gray',
  moved: 'color:blue',
  unchanged: 'hide',
  error: 'background:red',
  textDiffLine: 'color:gray'
}

export function ConsoleFormatter () {
  this.includeMoveDestinations = false
}

ConsoleFormatter.prototype = new BaseFormatter()

ConsoleFormatter.prototype.finalize = function (context) {
  var match = context.styles.length === 0
  var styles = context.styles
  var buffer = context.buffer
               .join('')
               .split('\n')
  buffer = buffer
               .filter((t, i) => !(t.match(/^ +$/) && buffer[i] === t))

  var styleCounter = 0
  for (var i = 0; i < buffer.length; i++) {
    var b = buffer[i]
    var styleOccurences = b.split('%c').length - 1
    if (styleOccurences === 0) {
      buffer[i] = '%c' + b
      styles.splice(styleCounter, 0, '')
      styleCounter++
    } else {
      styleCounter += styleOccurences
    }
  }

  var text = buffer.join('\n')
  return {
    logArguments: [text].concat(styles),
    match: match
  }
}

ConsoleFormatter.prototype.prepareContext = function (context) {
  BaseFormatter.prototype.prepareContext.call(this, context)
  context.styles = context.styles || []
  context.indent = function (levels) {
    this.indentLevel = (this.indentLevel || 0) +
      (typeof levels === 'undefined' ? 1 : levels)
    this.indentPad = new Array(this.indentLevel + 1).join('  ')
    this.outLine()
  }
  context.outLine = function () {
    this.buffer.push('\n' + (this.indentPad || ''))
  }
  context.out = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      var lines = arguments[i].split('\n')
      var text = lines.join('\n' + (this.indentPad || ''))
      if (this.color == null || this.color[0] !== 'hide') {
        if (this.color && this.color[0]) {
          text = '%c' + text
          this.styles.push(this.color[0])
        }
        this.buffer.push(text)
      }
    }
  }
  context.pushColor = function (color) {
    this.color = this.color || []
    this.color.unshift(color)
  }
  context.popColor = function () {
    this.color = this.color || []
    this.color.shift()
  }
}

ConsoleFormatter.prototype.typeFormattterErrorFormatter = function (context, err) {
  context.pushColor(colors.error)
  context.out('[ERROR]' + err)
  context.popColor()
}

ConsoleFormatter.prototype.formatValue = function (context, value) {
  context.out(JSON.stringify(value, null, 2))
}

ConsoleFormatter.prototype.formatTextDiffString = function (context, value) {
  var lines = this.parseTextDiff(value)
  context.indent()
  for (var i = 0, l = lines.length; i < l; i++) {
    var line = lines[i]
    context.pushColor(colors.textDiffLine)
    context.out(line.location.line + ',' + line.location.chr + ' ')
    context.popColor()
    var pieces = line.pieces
    for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
      var piece = pieces[pieceIndex]
      context.pushColor(colors[piece.type])
      context.out(piece.text)
      context.popColor()
    }
    if (i < l - 1) {
      context.outLine()
    }
  }
  context.indent(-1)
}

ConsoleFormatter.prototype.rootBegin = function (context, type, nodeType) {
  context.pushColor(colors[type])
  if (type === 'node') {
    context.out(nodeType === 'array' ? '[' : '{')
    context.indent()
  }
}

ConsoleFormatter.prototype.rootEnd = function (context, type, nodeType) {
  if (type === 'node') {
    context.indent(-1)
    context.out(nodeType === 'array' ? ']' : '}')
  }
  context.popColor()
}

ConsoleFormatter.prototype.nodeBegin = function (context, key, leftKey, type, nodeType) {
  context.pushColor(colors[type])
  context.out(leftKey + ': ')
  if (type === 'node') {
    context.out(nodeType === 'array' ? '[' : '{')
    context.indent()
  }
}

ConsoleFormatter.prototype.nodeEnd = function (context, key, leftKey, type, nodeType, isLast) {
  if (type === 'node') {
    context.indent(-1)
    context.out(nodeType === 'array' ? ']' : '}' +
      (isLast ? '' : ','))
  }
  if (!isLast) {
    context.outLine()
  }
  context.popColor()
}

/* jshint camelcase: false */

ConsoleFormatter.prototype.format_unchanged = function (context, delta, left) {
  if (typeof left === 'undefined') {
    return
  }
  this.formatValue(context, left)
}

ConsoleFormatter.prototype.format_movedestination = function (context, delta, left) {
  if (typeof left === 'undefined') {
    return
  }
  this.formatValue(context, left)
}

ConsoleFormatter.prototype.format_node = function (context, delta, left) {
  // recurse
  this.formatDeltaChildren(context, delta, left)
}

ConsoleFormatter.prototype.format_added = function (context, delta) {
  this.formatValue(context, delta[0])
}

ConsoleFormatter.prototype.format_modified = function (context, delta) {
  context.pushColor(colors.deleted)
  this.formatValue(context, delta[0])
  context.popColor()
  context.out(' => ')
  context.pushColor(colors.added)
  this.formatValue(context, delta[1])
  context.popColor()
}

ConsoleFormatter.prototype.format_deleted = function (context, delta) {
  this.formatValue(context, delta[0])
}

ConsoleFormatter.prototype.format_moved = function (context, delta) {
  context.out('==> ' + delta[1])
}

ConsoleFormatter.prototype.format_textdiff = function (context, delta) {
  this.formatTextDiffString(context, delta[0])
}

var defaultInstance

export default function format (delta, left) {
  if (!defaultInstance) {
    defaultInstance = new ConsoleFormatter()
  }
  return defaultInstance.format(delta, left)
};

export function log (delta, left) {
  console.log(format(delta, left))
}
