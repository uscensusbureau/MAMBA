import yaml
import os
import json
import re
def read_properties(directory):
    ''' The read_properties function gathers the configuration from where we need it, as well as converts legacy formats into our current format'''
    ####
    ##check if we have the mamba_config file, which is the gold standard.
    if 'mamba_config.yaml' in os.listdir(directory):
        '''In this case, we are using the new configuration'''
        with open(os.path.join(directory, 'mamba_config.yaml'), 'r') as file:
            config = yaml.safe_load(file)
        CONFIG = config['CONFIG']
        blocks = config['blocks']
        var_types = config['var_types']
        for v in var_types:
            if 'filter_only' not in v.keys():
                v['filter_only'] = {}
            if 'custom_variable_name' not in v.keys():
                v['custom_variable_name'] = ''
    elif 'mamba_properties.yaml' in os.listdir(directory):
        '''In this case, we are using yaml files for each of the three file types.'''
        print("I've detected a mamba_properties.yaml file, which indicates yoru files are in a legacy yaml format.  "
          "Not to worry, I will combine them into the correct format for you, the file will be called 'mamba_config.yaml' and will be saved."
          "You can edit this in the gui or directly in the future.")
        with open(os.path.join(directory, 'mamba_properties.yaml'), 'r') as file:
            CONFIG = yaml.safe_load(file)
        with open(os.path.join(directory, 'block_names.yaml'), 'r') as file:
            blocks = yaml.safe_load(file)
        with open(os.path.join(directory, 'mamba_variable_types.yaml'), 'r') as file:
            var_types = yaml.safe_load(file)
            for v in var_types:
                if 'filter_only' not in v.keys():
                    v['filter_only'] = {}
                if 'custom_variable_name' not in v.keys():
                    v['custom_variable_name'] = ''
        ###now writing them to the same yaml file
        config = {"CONFIG":CONFIG, "blocks":blocks, "var_types":var_types}
        ##now write to yaml
        with open(os.path.join(directory, 'mamba_config.yaml')) as file:
            yaml.dump(config, file)
            file.close()
    elif 'mamba.properties' in os.listdir(directory):
        '''In this case, we have the _original_ stuff, so we need to load and convert it'''
        print("I've detected a mamba.properties file, which indicates your configuration files are in a legacy properties/csv format.  "
          "Not to worry, I will combine them into the correct format for you in a file called 'mamba_config.yaml'."
            "You can edit this in the gui or directly in the future.")
        CONFIG = {}
        with open(os.path.join(directory, 'mamba.properties'), 'r') as f:
            for line in f:
                line = line.split('#')[0].rstrip()  # removes trailing whitespace and '\n' chars
                if "=" not in line: continue  # skips blanks and comments w/o =
                if line.startswith("#"): continue  # skips comments which contain =
                k, v = line.split(" = ", 1)
                ###detect a json payload
                if v[0] == '{':
                    CONFIG[k] = json.loads(v)
                elif v[0:2] == '[{':
                    CONFIG[k] = json.loads(v)
                elif v[0] == '[':
                    CONFIG[k] = v.split(',')
                else:
                    CONFIG[k] = v
        ####Now the variable types
        ###import the blocks and variable types
        file = open(os.path.join(directory, 'mamba_variable_types.csv'), mode='r', newline='\n')
        var_types = []
        lines = file.readlines()
        ###Set up the keys
        keys = lines[0].replace('\n', '').replace('\r', '').split(',')

        ###little function to figure out if number is all digits, negative, or a .
        def number_finder(s):
            return all(c in '0123456789.-' for c in s)
        ###Loop through the lines
        for line in lines[1:]:
            if len(line.replace('\n', '')) > 0:
                ###get the first bit of the line
                line_split = re.split(',\s*(?![^{}]*\})', line.replace('\n', ''))
                out_dict = {}
                for key in range(len(keys)):
                    if line_split[key] == '':
                        out_dict[keys[key]] = None
                    else:
                        out_dict[keys[key]] = line_split[key]
                for key in [CONFIG['data1_name'], CONFIG['data2_name'], 'variable_name']:
                    out_dict[key] = out_dict[key].lower()
                ###finally, do the json check
                ##first, empty dictionary if not included for a custom variable
                if 'custom_variable_name' not in out_dict.keys():
                    v['custom_variable_name'] = ''
                if out_dict['match_type'] == 'custom' and out_dict['custom_variable_kwargs'] is None:
                    out_dict['custom_variable_kwargs'] = {}
                ###now convert to a dictionary
                if out_dict['custom_variable_kwargs'] is not None:
                    out_dict['custom_variable_kwargs'] = json.loads(out_dict['custom_variable_kwargs'])
                    ###now, for each key, if it's only got +/- and number codes, convert to a float
                    for mykey in out_dict['custom_variable_kwargs'].keys():
                        if number_finder(out_dict['custom_variable_kwargs'][mykey]) == True:
                            out_dict['custom_variable_kwargs'][mykey] = float(out_dict['custom_variable_kwargs'][mykey])
                ####assume that a blank filter_only value means we don't want to use that variable only as a filter
                if 'filter_only' not in out_dict.keys():
                    out_dict['filter_only'] = {}
                else:
                    out_dict['filter_only'] = json.loads(out_dict['filter_only'])
                print(out_dict)
                var_types.append(out_dict)

        for i in range(len(var_types)):
            for key in ['match_type', 'variable_name', CONFIG['data1_name'], CONFIG['data2_name']]:
                if var_types[i][key] is None:
                    print(
                        'Error: mamba_variable_types row {} has blank key {}.  Cannot continue. Exiting'.format(i, key))
                    os._exit(0)

        ####Now the blocks
        ###note the legacy block file name call here
        file = open(os.path.join(directory, CONFIG['block_file_name']), mode='r', newline='\n')
        blocks = []
        lines = file.readlines()
        ###Set up the keys
        keys = lines[0].replace('\n', '').split(',')
        ###quickly strip out any spaces
        for line in lines[1:]:
            if len(line.replace('\n', '')) > 0:
                ###get the first bit of the line
                line_split = re.split(',\s*(?![^{}]*\})', line.replace('\n', ''))
                out_dict = {}
                for key in range(len(keys)):
                    if line_split[key] == '':
                        out_dict[keys[key]] = -1
                    else:
                        ###note the replacement here: if there was a comma (e.g the block was left(myvariable,2), you'll want to store it as left(myvariable$$2)
                        out_dict[keys[key]] = line_split[key].replace("$$", ",")
                for key in [CONFIG['data1_name'], CONFIG['data2_name'], 'block_name']:
                    out_dict[key] = out_dict[key].lower()
                ##check if there are semi-colons and they match
                if any([';' in i for i in [out_dict[CONFIG['data1_name']], out_dict[CONFIG['data2_name']]]]) == True:
                    if out_dict[CONFIG['data1_name']] != out_dict[CONFIG['data2_name']]:
                        print(
                            'Variable names for blocks separated by semi-colons do not match.  Please correct, order matters.  Shutting down')
                        os._exit(0)
                ###now check if the data1_name and data2_name files need to be converted to lists
                for key in [CONFIG['data1_name'], CONFIG['data2_name']]:
                    if ';' in out_dict[key]:
                        out_dict[key] = out_dict[key].split(';')
                ###finally, do the json check
                if out_dict['variable_filter_info'] != -1:
                    out_dict['variable_filter_info'] = json.loads(out_dict['variable_filter_info'])
                    ###now, for each key, if it's only got +/- and number codes, convert to a float
                    for mykey in out_dict['variable_filter_info'].keys():
                        if number_finder(out_dict['variable_filter_info'][mykey]) == True:
                            out_dict['variable_filter_info'][mykey] = float(out_dict['variable_filter_info'][mykey])
                blocks.append(out_dict)
        ###now writing them to the same yaml file
        config = {"CONFIG": CONFIG, "blocks": blocks, "var_types": var_types}
        ##now write to yaml
        with open(os.path.join(directory, 'mamba_config.yaml')) as file:
            yaml.dump(config, file)
            file.close()
    else:
        print('Something went wrong finding your configuration file.  Check that you have a mamba_config.yaml file or legacy configuration files saved in your project path.  Exiting')
        os._exit(0)
    return CONFIG,blocks,var_types