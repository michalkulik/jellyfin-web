import escapeHtml from 'escape-html';
import dom from '../../utils/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import actionsheet from '../actionSheet/actionSheet';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-button/emby-button';
import '../listview/listview.scss';
import 'material-design-icons-iconfont';
import '../formdialog.scss';
import './channelMapper.scss';

export default class ChannelMapper {
    constructor(options) {
        function mapChannel(button, channelId, providerChannelId) {
            loading.show();
            const providerId = options.providerId;
            ServerConnections.getApiClient(options.serverId).ajax({
                type: 'POST',
                url: ApiClient.getUrl('LiveTv/ChannelMappings'),
                data: JSON.stringify({
                    providerId: providerId,
                    tunerChannelId: channelId,
                    providerChannelId: providerChannelId
                }),
                contentType: 'application/json',
                dataType: 'json'
            }).then(mapping => {
                const listItem = dom.parentWithClass(button, 'listItem');
                button.setAttribute('data-providerid', mapping.ProviderChannelId || '');
                listItem.setAttribute('data-mapped', mapping.ProviderChannelId ? 'true' : 'false');
                listItem.querySelector('.secondary').innerText = getMappingSecondaryName(mapping, currentMappingOptions.ProviderName);
                const dlg = dom.parentWithClass(listItem, 'formDialog');
                if (dlg && typeof dlg.applyChannelFilter === 'function') {
                    dlg.applyChannelFilter();
                }
                loading.hide();
            });
        }

        function onChannelsElementClick(e) {
            const btnMap = dom.parentWithClass(e.target, 'btnMap');

            if (btnMap) {
                const channelId = btnMap.getAttribute('data-id');
                const providerChannelId = btnMap.getAttribute('data-providerid');
                const menuItems = currentMappingOptions.ProviderChannels.map(m => {
                    return {
                        name: m.Name,
                        id: m.Id,
                        selected: m.Id.toLowerCase() === providerChannelId.toLowerCase()
                    };
                }).sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                actionsheet.show({
                    positionTo: btnMap,
                    items: menuItems,
                    searchable: true
                }).then(newChannelId => {
                    mapChannel(btnMap, channelId, newChannelId);
                });
            }
        }

        function getChannelMappingOptions(serverId, providerId) {
            const apiClient = ServerConnections.getApiClient(serverId);
            return apiClient.getJSON(apiClient.getUrl('LiveTv/ChannelMappingOptions', {
                providerId: providerId
            }));
        }

        function getMappingSecondaryName(mapping, providerName) {
            return `${mapping.ProviderChannelName || ''} - ${providerName}`;
        }

        function getTunerChannelHtml(channel, providerName) {
            const isMapped = !!channel.ProviderChannelId;
            let html = '';
            html += `<div class="listItem" data-mapped="${isMapped ? 'true' : 'false'}">`;
            html += '<span class="material-icons listItemIcon dvr" aria-hidden="true"></span>';
            html += '<div class="listItemBody two-line">';
            html += '<h3 class="listItemBodyText">';
            html += escapeHtml(channel.Name);
            html += '</h3>';
            html += '<div class="secondary listItemBodyText">';

            if (channel.ProviderChannelName) {
                html += escapeHtml(getMappingSecondaryName(channel, providerName));
            }

            html += '</div>';
            html += '</div>';
            html += `<button class="btnMap autoSize" is="paper-icon-button-light" type="button" data-id="${channel.Id}" data-providerid="${channel.ProviderChannelId}"><span class="material-icons mode_edit" aria-hidden="true"></span></button>`;
            html += '</div>';
            return html;
        }

        function getEditorHtml() {
            let html = '';
            html += '<div class="formDialogContent smoothScrollY">';
            html += '<div class="dialogContentInner dialog-content-centered">';
            html += '<form style="margin:auto;">';
            html += `<h1>${globalize.translate('Channels')}</h1>`;
            html += '<div class="channelMapperToolbar">';
            html += '<label>';
            html += '<input type="checkbox" is="emby-checkbox" class="chkShowUnmappedOnly" />';
            html += `<span>${globalize.translate('ShowOnlyUnmappedChannels')}</span>`;
            html += '</label>';
            html += '</div>';
            html += '<div class="channels paperList">';
            html += '</div>';
            html += '</form>';
            html += '</div>';
            html += '</div>';
            return html;
        }

        function initEditor(dlg, initOptions) {
            const channelsElement = dlg.querySelector('.channels');

            dlg.applyChannelFilter = () => {
                const chkUnmapped = dlg.querySelector('.chkShowUnmappedOnly');
                const onlyUnmapped = chkUnmapped ? chkUnmapped.checked : false;
                channelsElement.querySelectorAll('.listItem').forEach(item => {
                    const isMapped = item.getAttribute('data-mapped') === 'true';
                    item.style.display = onlyUnmapped && isMapped ? 'none' : '';
                });
            };

            const chkUnmapped = dlg.querySelector('.chkShowUnmappedOnly');
            if (chkUnmapped) {
                chkUnmapped.addEventListener('change', dlg.applyChannelFilter);
            }

            loading.show();
            getChannelMappingOptions(initOptions.serverId, initOptions.providerId).then(result => {
                currentMappingOptions = result;
                channelsElement.innerHTML = result.TunerChannels.map(channel => {
                    return getTunerChannelHtml(channel, result.ProviderName);
                }).join('');
                channelsElement.addEventListener('click', onChannelsElementClick);
                dlg.applyChannelFilter();
                loading.hide();
            }).catch(err => {
                loading.hide();
                console.error('Error loading channel mapping options', err);
                channelsElement.innerHTML = `<div class="listItemBody"><div class="secondary listItemBodyText">${globalize.translate('ErrorDefault')}</div></div>`;
            });
        }

        let currentMappingOptions;

        this.show = () => {
            const dialogOptions = {
                removeOnClose: true
            };
            dialogOptions.size = 'small';
            const dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add('formDialog');
            dlg.classList.add('ui-body-a');
            dlg.classList.add('background-theme-a');
            let html = '';
            const title = globalize.translate('MapChannels');
            html += '<div class="formDialogHeader">';
            html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
            html += '<h3 class="formDialogHeaderTitle">';
            html += title;
            html += '</h3>';
            html += '</div>';
            html += getEditorHtml();
            dlg.innerHTML = html;
            initEditor(dlg, options);
            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
            return new Promise(resolve => {
                dlg.addEventListener('close', resolve);
                dialogHelper.open(dlg);
            });
        };
    }
}
