import { API, BlockTool, BlockToolData } from '@editorjs/editorjs';

interface ButtonData extends BlockToolData {
  text: string;
  url?: string; // Legacy: for regular links
  webhookId?: number; // New: for secure webhooks from database
  style: 'primary' | 'secondary' | 'outline' | 'danger';
  alignment: 'left' | 'center' | 'right';
  openInNewTab: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  description?: string;
}

export default class ButtonTool implements BlockTool {
  api: API;
  data: ButtonData;
  wrapper: HTMLElement | null;
  settings: { name: string; icon: string }[];
  webhooks: WebhookEndpoint[];
  webhookSelectElement: HTMLSelectElement | null;

  constructor({ data, api }: { data?: ButtonData; api: API }) {
    this.api = api;
    this.data = {
      text: data?.text || 'Click me',
      url: data?.url || '',
      webhookId: data?.webhookId,
      style: data?.style || 'primary',
      alignment: data?.alignment || 'center',
      openInNewTab: data?.openInNewTab ?? true, // Default to true if undefined
      successMessage: data?.successMessage || 'Webhook triggered successfully!',
      errorMessage: data?.errorMessage || 'Failed to trigger webhook',
    };
    this.wrapper = null;
    this.webhooks = [];
    this.webhookSelectElement = null;

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

    // Load webhooks from API
    this.loadWebhooks();
  }

  async loadWebhooks() {
    try {
      console.log('ButtonTool: Loading webhooks from API...');
      const response = await fetch('/api/webhooks/endpoints', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.webhooks = data.endpoints || [];
        console.log('ButtonTool: Loaded webhooks:', this.webhooks);
        // Update select element if it exists
        this.updateWebhookSelect();
      } else {
        console.error('ButtonTool: Failed to load webhooks - HTTP', response.status);
        // Still call update to show "No webhooks available"
        this.updateWebhookSelect();
      }
    } catch (error) {
      console.error('ButtonTool: Failed to load webhooks:', error);
      // Still call update to show "No webhooks available"
      this.updateWebhookSelect();
    }
  }

  updateWebhookSelect() {
    if (!this.webhookSelectElement) {
      console.log('ButtonTool: updateWebhookSelect called but select element not created yet');
      return;
    }

    console.log('ButtonTool: Updating webhook select. Webhooks count:', this.webhooks.length);

    // Clear all existing options
    this.webhookSelectElement.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';

    if (this.webhooks.length === 0) {
      // Show placeholder when no webhooks are available
      defaultOption.textContent = 'No webhooks available - create one in settings';
      defaultOption.disabled = true;
      this.webhookSelectElement.disabled = true;
    } else {
      // Show normal placeholder when webhooks are available
      defaultOption.textContent = 'Select a webhook...';
      this.webhookSelectElement.disabled = false;
    }

    this.webhookSelectElement.appendChild(defaultOption);

    // Add webhook options
    this.webhooks.forEach(webhook => {
      const option = document.createElement('option');
      option.value = webhook.id.toString();
      option.textContent = `${webhook.name}${webhook.description ? ` (${webhook.description})` : ''}`;
      if (this.data.webhookId === webhook.id) {
        option.selected = true;
        console.log('ButtonTool: Pre-selected webhook:', webhook.id, webhook.name);
      }
      this.webhookSelectElement!.appendChild(option);
    });

    console.log('ButtonTool: Webhook select updated with', this.webhooks.length, 'options');
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

    // Link type selector (URL or Webhook)
    const linkTypeContainer = document.createElement('div');
    linkTypeContainer.style.marginTop = '12px';
    linkTypeContainer.style.marginBottom = '8px';
    linkTypeContainer.style.fontSize = '14px';

    const linkTypeLabel = document.createElement('div');
    linkTypeLabel.textContent = 'Button Action:';
    linkTypeLabel.style.fontWeight = '500';
    linkTypeLabel.style.marginBottom = '6px';

    const radioContainer = document.createElement('div');
    radioContainer.style.display = 'flex';
    radioContainer.style.gap = '16px';

    const urlRadio = document.createElement('label');
    urlRadio.style.display = 'flex';
    urlRadio.style.alignItems = 'center';
    urlRadio.style.cursor = 'pointer';
    const urlRadioInput = document.createElement('input');
    urlRadioInput.type = 'radio';
    urlRadioInput.name = 'linkType';
    urlRadioInput.value = 'url';
    urlRadioInput.checked = !this.data.webhookId;
    urlRadioInput.style.marginRight = '4px';
    urlRadio.appendChild(urlRadioInput);
    urlRadio.appendChild(document.createTextNode('URL / Link'));

    const webhookRadio = document.createElement('label');
    webhookRadio.style.display = 'flex';
    webhookRadio.style.alignItems = 'center';
    webhookRadio.style.cursor = 'pointer';
    const webhookRadioInput = document.createElement('input');
    webhookRadioInput.type = 'radio';
    webhookRadioInput.name = 'linkType';
    webhookRadioInput.value = 'webhook';
    webhookRadioInput.checked = !!this.data.webhookId;
    webhookRadioInput.style.marginRight = '4px';
    webhookRadio.appendChild(webhookRadioInput);
    webhookRadio.appendChild(document.createTextNode('Webhook (Secure)'));

    radioContainer.appendChild(urlRadio);
    radioContainer.appendChild(webhookRadio);
    linkTypeContainer.appendChild(linkTypeLabel);
    linkTypeContainer.appendChild(radioContainer);

    // URL input (for regular links)
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = this.data.url || '';
    urlInput.placeholder = 'Enter URL';
    urlInput.style.width = '100%';
    urlInput.style.marginTop = '8px';
    urlInput.style.padding = '8px';
    urlInput.style.border = '1px solid #e0e0e0';
    urlInput.style.borderRadius = '4px';
    urlInput.style.fontSize = '14px';
    urlInput.style.display = !this.data.webhookId ? 'block' : 'none';

    urlInput.addEventListener('input', () => {
      this.data.url = urlInput.value;
    });

    // Webhook selector (for secure webhooks)
    const webhookSelect = document.createElement('select');
    this.webhookSelectElement = webhookSelect; // Save reference for async updates
    webhookSelect.style.width = '100%';
    webhookSelect.style.marginTop = '8px';
    webhookSelect.style.padding = '8px';
    webhookSelect.style.border = '1px solid #e0e0e0';
    webhookSelect.style.borderRadius = '4px';
    webhookSelect.style.fontSize = '14px';
    webhookSelect.style.display = !!this.data.webhookId ? 'block' : 'none';

    // Populate webhooks (will be updated async when loadWebhooks completes)
    this.updateWebhookSelect();

    webhookSelect.addEventListener('change', () => {
      const selectedValue = webhookSelect.value;
      console.log('ButtonTool: Webhook select changed. Value:', selectedValue, 'Type:', typeof selectedValue);

      if (selectedValue && selectedValue !== '') {
        this.data.webhookId = parseInt(selectedValue);
        console.log('ButtonTool: Set webhookId to:', this.data.webhookId);
      } else {
        this.data.webhookId = undefined;
        console.log('ButtonTool: Cleared webhookId (empty selection)');
      }

      console.log('ButtonTool: Current button data:', JSON.stringify(this.data, null, 2));
    });

    // Define warning update function (will be assigned later after warning element is created)
    let updateWarning: (() => void) | null = null;

    // Radio button change handlers
    urlRadioInput.addEventListener('change', () => {
      if (urlRadioInput.checked) {
        this.data.webhookId = undefined;
        urlInput.style.display = 'block';
        webhookSelect.style.display = 'none';
        newTabCheckbox.style.display = 'inline-flex';
        console.log('Switched to URL mode');
        // Update warning visibility
        if (updateWarning) updateWarning();
      }
    });

    webhookRadioInput.addEventListener('change', () => {
      if (webhookRadioInput.checked) {
        this.data.url = undefined;
        urlInput.style.display = 'none';
        webhookSelect.style.display = 'block';
        newTabCheckbox.style.display = 'none';
        console.log('Switched to Webhook mode');
        // Update warning visibility
        if (updateWarning) updateWarning();
      }
    });

    const successMessageInput = document.createElement('textarea');
    successMessageInput.value = this.data.successMessage || '';
    successMessageInput.placeholder = 'Success message (shown when webhook succeeds)';
    successMessageInput.style.width = '100%';
    successMessageInput.style.marginTop = '8px';
    successMessageInput.style.padding = '8px';
    successMessageInput.style.border = '1px solid #e0e0e0';
    successMessageInput.style.borderRadius = '4px';
    successMessageInput.style.fontSize = '14px';
    successMessageInput.style.minHeight = '60px';
    successMessageInput.style.resize = 'vertical';
    successMessageInput.style.fontFamily = 'inherit';

    successMessageInput.addEventListener('input', () => {
      this.data.successMessage = successMessageInput.value;
    });

    const errorMessageInput = document.createElement('textarea');
    errorMessageInput.value = this.data.errorMessage || '';
    errorMessageInput.placeholder = 'Error message (shown when webhook fails)';
    errorMessageInput.style.width = '100%';
    errorMessageInput.style.marginTop = '8px';
    errorMessageInput.style.padding = '8px';
    errorMessageInput.style.border = '1px solid #e0e0e0';
    errorMessageInput.style.borderRadius = '4px';
    errorMessageInput.style.fontSize = '14px';
    errorMessageInput.style.minHeight = '60px';
    errorMessageInput.style.resize = 'vertical';
    errorMessageInput.style.fontFamily = 'inherit';

    errorMessageInput.addEventListener('input', () => {
      this.data.errorMessage = errorMessageInput.value;
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
    newTabCheckbox.style.display = !!this.data.webhookId ? 'none' : 'inline-flex';
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
      console.log('Open in new tab changed:', checkbox.checked);
    });

    newTabCheckbox.appendChild(checkbox);
    newTabCheckbox.appendChild(document.createTextNode('Open in new tab'));

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.marginTop = '8px';

    controls.appendChild(styleSelector);
    controls.appendChild(newTabCheckbox);

    // Warning message for incomplete button
    const warningMessage = document.createElement('div');
    warningMessage.style.marginTop = '12px';
    warningMessage.style.padding = '8px 12px';
    warningMessage.style.backgroundColor = '#fef3c7';
    warningMessage.style.border = '1px solid #f59e0b';
    warningMessage.style.borderRadius = '4px';
    warningMessage.style.fontSize = '13px';
    warningMessage.style.color = '#92400e';
    warningMessage.style.display = 'none'; // Hidden by default
    warningMessage.innerHTML = '⚠️ <strong>Action required:</strong> Please select a webhook or enter a URL before saving this page.';

    // Assign the warning update function
    updateWarning = () => {
      const hasUrl = urlInput.value.trim() !== '';
      const hasWebhook = webhookSelect.value !== '';

      if (!hasUrl && !hasWebhook) {
        warningMessage.style.display = 'block';
      } else {
        warningMessage.style.display = 'none';
      }
    };

    // Update warning when inputs change
    urlInput.addEventListener('input', updateWarning);
    webhookSelect.addEventListener('change', updateWarning);

    // Initial warning check
    updateWarning();

    container.appendChild(button);
    this.wrapper.appendChild(container);
    this.wrapper.appendChild(linkTypeContainer);
    this.wrapper.appendChild(urlInput);
    this.wrapper.appendChild(webhookSelect);
    this.wrapper.appendChild(successMessageInput);
    this.wrapper.appendChild(errorMessageInput);
    this.wrapper.appendChild(controls);
    this.wrapper.appendChild(warningMessage);

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
    console.log('ButtonTool save() called, initial data:', JSON.stringify(this.data));
    console.log('ButtonTool save() - webhookSelectElement exists?', !!this.webhookSelectElement);

    if (this.webhookSelectElement) {
      console.log('ButtonTool save() - select value:', this.webhookSelectElement.value);
      console.log('ButtonTool save() - select display:', this.webhookSelectElement.style.display);
      console.log('ButtonTool save() - select options:', Array.from(this.webhookSelectElement.options).map(o => ({ value: o.value, text: o.text, selected: o.selected })));
    }

    // Defensive: Ensure we capture the current webhook selection even if change event didn't fire
    if (this.webhookSelectElement && this.webhookSelectElement.value && this.webhookSelectElement.value !== '') {
      const selectedWebhookId = parseInt(this.webhookSelectElement.value);
      if (!isNaN(selectedWebhookId) && selectedWebhookId > 0) {
        console.log('ButtonTool save(): Capturing webhook selection from DOM:', selectedWebhookId);
        this.data.webhookId = selectedWebhookId;
        // Clear URL when webhook is selected
        this.data.url = undefined;
      }
    }

    // Defensive: Ensure we capture the current URL even if change event didn't fire
    const urlInputElement = blockContent.querySelector('input[type="text"][placeholder="Enter URL"]') as HTMLInputElement;
    if (urlInputElement && urlInputElement.value && urlInputElement.value.trim() !== '' && !this.data.webhookId) {
      console.log('ButtonTool save(): Capturing URL from DOM:', urlInputElement.value);
      this.data.url = urlInputElement.value.trim();
    }

    console.log('ButtonTool save() called, final data:', JSON.stringify(this.data));
    return this.data;
  }

  validate(savedData: ButtonData): boolean {
    // Only require non-empty text during editing
    // URL/webhook can be incomplete while editing
    if (!savedData.text || savedData.text.trim() === '') {
      console.log('ButtonTool validate(): Failed - empty text');
      return false;
    }

    console.log('ButtonTool validate(): Passed - has text:', savedData.text);
    return true;
  }

  static get sanitize() {
    return {
      text: true,
      url: true,
      webhookId: true,
      style: true,
      alignment: true,
      openInNewTab: true,
      successMessage: true,
      errorMessage: true,
    };
  }
}