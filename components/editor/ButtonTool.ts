import { API, BlockTool, BlockToolData, ToolConfig } from '@editorjs/editorjs';

interface ButtonData extends BlockToolData {
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'outline' | 'danger';
  alignment: 'left' | 'center' | 'right';
  openInNewTab: boolean;
}

export default class ButtonTool implements BlockTool {
  api: API;
  data: ButtonData;
  wrapper: HTMLElement | null;
  settings: { name: string; icon: string }[];

  constructor({ data, api }: { data?: ButtonData; api: API }) {
    this.api = api;
    this.data = {
      text: data?.text || 'Click me',
      url: data?.url || '',
      style: data?.style || 'primary',
      alignment: data?.alignment || 'center',
      openInNewTab: data?.openInNewTab !== false,
    };
    this.wrapper = null;

    this.settings = [
      {
        name: 'left',
        icon: `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 5h10v2H2zm0 4h10v2H2zm0 4h10v2H2z"/></svg>`,
      },
      {
        name: 'center',
        icon: `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5h10v2H5zm0 4h10v2H5zm0 4h10v2H5z"/></svg>`,
      },
      {
        name: 'right',
        icon: `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M8 5h10v2H8zm0 4h10v2H8zm0 4h10v2H8z"/></svg>`,
      },
    ];
  }

  static get toolbox() {
    return {
      title: 'Button',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('ce-button-tool');
    
    const container = document.createElement('div');
    container.classList.add('button-container');
    container.style.textAlign = this.data.alignment;
    container.style.margin = '16px 0';

    const button = document.createElement('div');
    button.classList.add('button-element');
    button.contentEditable = 'false';
    button.style.display = 'inline-block';
    button.style.padding = '12px 24px';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = '500';
    button.style.transition = 'all 0.3s ease';
    button.style.userSelect = 'none';
    
    this.applyStyle(button);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = this.data.text;
    textInput.placeholder = 'Button text';
    textInput.style.background = 'transparent';
    textInput.style.border = 'none';
    textInput.style.outline = 'none';
    textInput.style.color = 'inherit';
    textInput.style.fontWeight = 'inherit';
    textInput.style.fontSize = 'inherit';
    textInput.style.textAlign = 'center';
    textInput.style.width = '100%';
    textInput.style.cursor = 'text';

    textInput.addEventListener('input', () => {
      this.data.text = textInput.value;
    });

    textInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    button.appendChild(textInput);

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = this.data.url;
    urlInput.placeholder = 'Enter URL or webhook endpoint';
    urlInput.style.width = '100%';
    urlInput.style.marginTop = '8px';
    urlInput.style.padding = '8px';
    urlInput.style.border = '1px solid #e0e0e0';
    urlInput.style.borderRadius = '4px';
    urlInput.style.fontSize = '14px';

    urlInput.addEventListener('input', () => {
      this.data.url = urlInput.value;
    });

    const styleSelector = document.createElement('select');
    styleSelector.style.marginTop = '8px';
    styleSelector.style.padding = '8px';
    styleSelector.style.border = '1px solid #e0e0e0';
    styleSelector.style.borderRadius = '4px';
    styleSelector.style.fontSize = '14px';
    styleSelector.style.marginRight = '8px';

    const styles = [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
      { value: 'danger', label: 'Danger' },
    ];

    styles.forEach(style => {
      const option = document.createElement('option');
      option.value = style.value;
      option.textContent = style.label;
      if (style.value === this.data.style) {
        option.selected = true;
      }
      styleSelector.appendChild(option);
    });

    styleSelector.addEventListener('change', () => {
      this.data.style = styleSelector.value as ButtonData['style'];
      this.applyStyle(button);
    });

    const newTabCheckbox = document.createElement('label');
    newTabCheckbox.style.display = 'inline-flex';
    newTabCheckbox.style.alignItems = 'center';
    newTabCheckbox.style.marginLeft = '8px';
    newTabCheckbox.style.fontSize = '14px';
    newTabCheckbox.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.data.openInNewTab;
    checkbox.style.marginRight = '4px';

    checkbox.addEventListener('change', () => {
      this.data.openInNewTab = checkbox.checked;
    });

    newTabCheckbox.appendChild(checkbox);
    newTabCheckbox.appendChild(document.createTextNode('Open in new tab'));

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.marginTop = '8px';

    controls.appendChild(styleSelector);
    controls.appendChild(newTabCheckbox);

    container.appendChild(button);
    this.wrapper.appendChild(container);
    this.wrapper.appendChild(urlInput);
    this.wrapper.appendChild(controls);

    return this.wrapper;
  }

  applyStyle(button: HTMLElement) {
    button.style.transition = 'all 0.3s ease';
    
    switch (this.data.style) {
      case 'primary':
        button.style.backgroundColor = '#3b82f6';
        button.style.color = 'white';
        button.style.border = '2px solid #3b82f6';
        button.onmouseenter = () => {
          button.style.backgroundColor = '#2563eb';
          button.style.borderColor = '#2563eb';
        };
        button.onmouseleave = () => {
          button.style.backgroundColor = '#3b82f6';
          button.style.borderColor = '#3b82f6';
        };
        break;
      case 'secondary':
        button.style.backgroundColor = '#6b7280';
        button.style.color = 'white';
        button.style.border = '2px solid #6b7280';
        button.onmouseenter = () => {
          button.style.backgroundColor = '#4b5563';
          button.style.borderColor = '#4b5563';
        };
        button.onmouseleave = () => {
          button.style.backgroundColor = '#6b7280';
          button.style.borderColor = '#6b7280';
        };
        break;
      case 'outline':
        button.style.backgroundColor = 'transparent';
        button.style.color = '#3b82f6';
        button.style.border = '2px solid #3b82f6';
        button.onmouseenter = () => {
          button.style.backgroundColor = '#3b82f6';
          button.style.color = 'white';
        };
        button.onmouseleave = () => {
          button.style.backgroundColor = 'transparent';
          button.style.color = '#3b82f6';
        };
        break;
      case 'danger':
        button.style.backgroundColor = '#ef4444';
        button.style.color = 'white';
        button.style.border = '2px solid #ef4444';
        button.onmouseenter = () => {
          button.style.backgroundColor = '#dc2626';
          button.style.borderColor = '#dc2626';
        };
        button.onmouseleave = () => {
          button.style.backgroundColor = '#ef4444';
          button.style.borderColor = '#ef4444';
        };
        break;
    }
  }

  renderSettings(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('cdx-settings-buttons');

    this.settings.forEach((setting) => {
      const button = document.createElement('div');
      button.classList.add('cdx-settings-button');
      button.innerHTML = setting.icon;
      button.classList.toggle(
        'cdx-settings-button--active',
        setting.name === this.data.alignment
      );

      button.addEventListener('click', () => {
        this.data.alignment = setting.name as ButtonData['alignment'];
        if (this.wrapper) {
          const container = this.wrapper.querySelector('.button-container') as HTMLElement;
          if (container) {
            container.style.textAlign = this.data.alignment;
          }
        }
      });

      wrapper.appendChild(button);
    });

    return wrapper;
  }

  save(blockContent: HTMLElement): ButtonData {
    return this.data;
  }

  validate(savedData: ButtonData): boolean {
    return savedData.text.trim() !== '';
  }

  static get sanitize() {
    return {
      text: {},
      url: {},
      style: {},
      alignment: {},
      openInNewTab: {},
    };
  }
}