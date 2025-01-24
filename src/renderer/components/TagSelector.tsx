import { Autocomplete } from '@mui/material';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';

import { GET_UNIQUE_TAGS } from '../../shared/constants';
import { formatTag } from '../../shared/validators';
import TextField from './TextField';

export type TagSelectorProps = {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
};
const TagSelector: FC<TagSelectorProps> = ({ tags, onChangeTags }) => {
  const [tagOptions, setTagOptions] = useState([] as string[]);

  useEffect(() => {
    ipcRenderer.once(GET_UNIQUE_TAGS, (_, args) => {
      if (args.tags && !args.err) {
        setTagOptions(args.tags);
      }
    });
    ipcRenderer.send(GET_UNIQUE_TAGS);
  }, []);

  const saveTags = (arr: string[]): void => onChangeTags(arr.map(formatTag));

  return (
    <>
      <Autocomplete
        multiple
        id="tags-outlined"
        options={tagOptions}
        value={tags || []}
        onChange={(_, arr) => {
          saveTags(arr);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Tags..."
            placeholder="Tags"
            onKeyDown={(e) => {
              const element = e.target as HTMLInputElement;
              const { value } = element;
              if (e.key === 'Enter' && value.trim()) {
                saveTags(tags.concat(value));
              }
            }}
          />
        )}
      />
    </>
  );
};
export default TagSelector;
