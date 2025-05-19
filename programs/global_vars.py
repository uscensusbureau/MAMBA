# -*- coding: utf-8 -*-
import sys
import os
import re
import json
sys.path.append(os.getcwd())
import time
import pandas as pd
###turn off chain warnings
pd.options.mode.chained_assignment = None  # default='warn'
#from sklearn.preprocessing import Imputer
import logging
#from runner_block import *
from nltk.stem.porter import PorterStemmer
from nltk.stem import WordNetLemmatizer
lemmatizer = WordNetLemmatizer()
stemmer = PorterStemmer()
####Load the CONFIG
##get properties
from programs.config import *
import datetime as dt

############
###CHUNK: SET DATA AND PROGRAM PATH, TIME, AND IMPORT FEBRL
############
####
projectPath = os.environ['projectPath']
##Check if it ends in a /, if it does, leave it, otherwise add a /
if projectPath[-1:] == '/':
    projectPath = projectPath[:-1]

####read in the mamba properties file by grabbing a function from the standardized frame folder
os.chdir('..')
sys.path.append(os.getcwd()) 
#os.chdir('/MAMBA_EDL')
CONFIG, blocks, var_types = read_properties(projectPath)

###add the DB password to CONFIG if not present
if 'db_password' not in CONFIG.keys() and CONFIG['sql_flavor']!='sqlite':
    ##check if there's an os.environ key
    ###if we have a password saved as an environment variable, upload it.
    if 'db_password_env_var' in CONFIG:
        CONFIG['db_password'] = os.environ[CONFIG['db_password_env_var']]
    else:
        print('DB PASSWORD NOT DETECTED. FINDING ENCRYPTED PASSWORD using environment encryptionPath')
        try:
            ###Load and decrypt the DB password
            from programs.encrypt_fernet import *
            keyfile = open('{}/key.txt'.format(os.environ['encryptionPath']))
            key = keyfile.read()
            ##make the encryption object
            f = Fernet(key)
            ###Load the token
            tokenfile=open('{}/pw.txt'.format(os.environ['encryptionPath']))
            token = tokenfile.read()
            ###decrypt
            pw = f.decrypt(bytes(token, 'utf-8')).decode('utf-8')
            CONFIG['db_password']=pw
        except Exception as error:
            print('Error in decrypting password: {}'.format(error))
            print('Quitting')
            os._exit(0)


CONFIG['date']=dt.datetime.now().date().strftime("%Y_%m_%d")
CONFIG['projectPath']=projectPath


import programs.febrl_methods as feb

###setting the start time
starttime = time.time()

# load the febrl source code
################
##Starting the program
################
start = time.time()
###This list of methods we will use
methods = [feb.jaro, feb.winkler, feb.bagdist, feb.seqmatch, feb.qgram2, feb.qgram3, feb.posqgram3, feb.editdist,
           feb.lcs2, feb.lcs3, feb.charhistogram, feb.swdist, feb.ontolcs3,feb.ontolcs2,feb.sortwinkler,feb.editex]
if 'used_fuzzy_metrics' in CONFIG.keys():
    methods = [k for k in methods if k.__name__ in [b.replace('feb.','') for b in CONFIG['used_fuzzy_metrics']]]
###The list of names for those methods
namelist = [i.__name__ for i in methods]
##date and time
date = dt.datetime.now().date()
numWorkers=int(CONFIG['numWorkers'])

###import the blocks and variable types
#blocks=json.loads(json.dumps(linkage_db_configs['block_names']))
#var_types=json.loads(json.dumps(linkage_db_configs['var_types']))

###little function to figure out if number is all digits, negative, or a .
def number_finder(s):
    return all(c in '0123456789.-' for c in s)

###if we are in deduplication mode, need to change CONFIG['data1_name'] and CONFIG['data2_name'] appropriately
if CONFIG['mode']=='deduplication':
    CONFIG['data1_table_name']=CONFIG['target_table']
    CONFIG['data2_table_name']=CONFIG['target_table']
    CONFIG['data1_name']='left'
    CONFIG['data2_name']='right'
else:
    CONFIG['data1_table_name']=CONFIG['data1_name']
    CONFIG['data2_table_name']=CONFIG['data2_name']

'''
###create the address_component_tag_mapping
address_components = pd.read_csv('Documentation/address_component_mapping.csv').to_dict('records')
###makte the address component mapping.###lower on blocks is the issue here
address_component_mapping={}
for component in [add['address_component'] for add in address_components]:
    component_lower=component.lower()
    if component_lower in [block['block_name'] for block in blocks] or component_lower in [var['variable_name'] for var in var_types]:
        address_component_mapping[component] = component
    else:
        address_component_mapping[component] = 'address1'
'''

if __name__=='__main__':
    print('why did you do this?')
