import { Notice, Setting } from "obsidian";
import { ColumnSettingsHandlerResponse } from "cdm/ModalsModel";
import { AbstractHandlerClass } from "patterns/AbstractHandler";
import { dbTrim } from "helpers/StylesHelper";
import { TableColumn } from "cdm/FolderModel";

export class ColumnIdInputHandler extends AbstractHandlerClass<ColumnSettingsHandlerResponse> {
    settingTitle: string = 'Column id';
    handle(response: ColumnSettingsHandlerResponse): ColumnSettingsHandlerResponse {
        const { column, containerEl, columnSettingsManager } = response;
        const { columnsState, dataState, configState } = columnSettingsManager.modal;
        let value = `${column.key}${column.nestedKey ? `.${column.nestedKey}` : ''}`;
        new Setting(containerEl)
            .setName(this.settingTitle)
            .setDesc("Enter the column id of the column")
            .addText(text => {
                text.setPlaceholder("Write your nested key...")
                    .setValue(value)
                    .onChange((newId: string) => {
                        value = dbTrim(newId);
                    })
            }).addExtraButton((cb) => {
                cb.setIcon("save")
                    .setTooltip("Save column id")
                    .onClick(async (): Promise<void> => {
                        const arrayKey = value.split('.');
                        const rootKey = arrayKey.shift();

                        if (!this.validateNewId(rootKey, arrayKey, columnsState.info.getAllColumns())) {
                            new Notice(`Error saving id. There is a conflict with another column id or the id is empty`, 3000);
                            return;
                        }
                        // Update state of altered column
                        await columnsState.actions
                            .alterColumnId(column, rootKey, arrayKey);

                        if (rootKey !== column.key) {
                            // Update key of all notes
                            await dataState.actions.updateDataAfterLabelChange(
                                column,
                                rootKey,
                                columnsState.info.getAllColumns(),
                                configState.info.getLocalSettings()
                            )
                            // Rename column in group_folder_column
                            const groupFolderColumn = configState.info.getLocalSettings().group_folder_column.split(",");
                            if (groupFolderColumn.includes(column.key)) {
                                const newGroupFolderColumn = groupFolderColumn
                                    .map((item) => (item === column.key ? rootKey : item))
                                    .join(",");
                                configState.actions.alterConfig({ group_folder_column: newGroupFolderColumn });
                                // Reorganize files and remove empty folders
                                await dataState.actions.groupFiles();
                            }
                        }
                        new Notice(`new column id was saved: ${value}`, 1500);
                        columnSettingsManager.modal.enableReset = true;
                    });
            });


        return this.goNext(response);
    }
    private validateNewId(rootKey: string, arrayKey: string[], columns: TableColumn[]): boolean {
        const candidateId = `${rootKey}${arrayKey.length > 0 ? `-${arrayKey.join('-')}` : ''}`;
        if (!rootKey) {
            return false;
        }
        const conflictId = columns.some((column: TableColumn) =>
            column.id === candidateId
        );
        return !conflictId;
    }
}