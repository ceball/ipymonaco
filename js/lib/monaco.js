var monaco = require('monaco-editor');
var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');

// See monaco.py for the kernel counterpart to this file.

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var MonacoModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'MonacoModel',
        _view_name: 'MonacoView',
        _model_module: 'ipymonaco',
        _view_module: 'ipymonaco',
        _model_module_version: '0.0.21',
        _view_module_version: '0.0.21',
        value: '',
        theme: '',
        language: '',
        height: 300,
        readOnly: false,
        rulers: [],
        useTabStops: false,
        wordWrap: 'off',
        wordWrapColumn: 80,
    })
});


// Custom View. Renders the widget model.
var MonacoView = widgets.DOMWidgetView.extend({
    // Defines how the widget gets rendered into the DOM
    render: function () {
        this.container_input = document.createElement('div');
        this.container_input.setAttribute("id", "container");
        this.container_input.setAttribute("style", "height: " + this.model.get('height') + "px;");

        this.el.appendChild(this.container_input);
    },

    initializeEditor: function () {
        console.log('loaded monaco');
        this.codeEditor = monaco.editor.create(this.container_input,
            {
                language: this.model.get('language'),
                theme: this.model.get('theme'),
                value: this.model.get('value'),
                readOnly: this.model.get('readOnly'),
                rulers: this.model.get('rulers'),
                useTabStops: this.model.get('useTabStops'),
                wordWrap: this.model.get('wordWrap'),
                wordWrapColumn: this.model.get('wordWrapColumn'),
            });

        // JavaScript -> Python update
        let textModel = this.codeEditor.getModel();
        this.textModel = textModel;
        textModel.onDidChangeContent((event) => {
            this.model.set('value', textModel.getValue());
            this.model.save_changes();
        });

        // Python -> JavaScript update
        this.model.on('change:value', this.value_changed, this);
    },

    value_changed: function () {
        this.textModel.setValue(this.model.get('value'));
    },

    processPhosphorMessage: function (msg) {
        widgets.DOMWidgetView.prototype.processPhosphorMessage.call(this, msg);
        switch (msg.type) {
            case 'after-attach':
                this.initializeEditor();
            case 'after-show':
                if (this.codeEditor !== undefined) {
                    this.codeEditor.layout();  // Reinitialize the editor's layout
                }
                break;
        }
    },

    processLuminoMessage: function (msg) {
        widgets.DOMWidgetView.prototype.processLuminoMessage.call(this, msg);
        switch (msg.type) {
            case 'after-attach':
                this.initializeEditor();
            case 'after-show':
                if (this.codeEditor !== undefined) {
                    this.codeEditor.layout();  // Reinitialize the editor's layout
                }
                break;
        }
    },
});


module.exports = {
    MonacoModel: MonacoModel,
    MonacoView: MonacoView
};
