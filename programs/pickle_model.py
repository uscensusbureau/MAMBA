'''
This little helper file is what you will use to convert your model to a pickle object MAMBA will recognize

USAGE

1.  CD into MAMBA directory.
2.  Type 'python programs/pickel_model.py -projectPath /your/project/path -headers list,of,headers -saved_file_name
'''

import argparse
import json
import os
import sys
sys.path.append(os.getcwd())
from inspect import getmembers, isclass
from joblib import dump
from programs.model_load_save_helpers import *

if __name__=='__main__':
    parser = argparse.ArgumentParser(description='Pickle Your Model')
    parser.add_argument('-projectPath', dest='projectPath', required=True, type=str, help='full path to your projectPath')
    parser.add_argument('-headers', dest='headers', required=True, type=str, help='comma separated list of headers used by your model.  Fuzzy are of the form {variable_name}_{fuzzy_name}')
    parser.add_argument('-saved_file_name', dest='saved_file_name', required=True, type=str, help='What is the name you want to give to your saved model?')
    parser.add_argument('-model_name', dest='model_name', required=True, type=str, help='The name of the model class youw ant to get')
    argvs = parser.parse_args()
    info = {"type":"custom", "score":None, "variable_headers":argvs.headers.split(',')}
    with open(os.path.join(argvs.projectPath, '{}.txt'.format(argvs.saved_file_name)),'w') as file:
        file.write(json.dumps(info))
    file.close()
    ####now save the actual model
    os.chdir(argvs.projectPath)
    sys.path.append(os.getcwd())
    import custom_model as cust_model
    try:
        my_function = [i[1] for i in getmembers(cust_model) if i[0]==argvs.model_name][0]
    except Exception as error:
        print('Error: Unable to find a class of the name {}, check again. Exiting'.format(argvs.model_name))
        os._exit(0)
    try:
        dump(my_function, os.path.join(argvs.projectPath, '{}.joblib'.format(argvs.saved_file_name)))
        print('Success!')
        os._exit(0)
    except Exception as error:
        print('Error dumping model. Error {}. Exiting'.format(error))
        os._exit(0)






