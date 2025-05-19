'''
This is a quick script used to generate our training and testing data based on the identity.R10000_data and R10000_data files downloaded from R

Instructions:
1.  CD into the R10000 directory.
2.  Type python generate_data.py
'''

import os
import pandas as pd

if __name__=='__main__':
    ###load the main data
    data = pd.read_csv('r10000_data.csv', na_values=['NA'])
    identity = pd.read_csv('identity.csv')
    data['ent_id'] = identity['x']
    data['id'] = data.index
    ###now formatting our DOB
    data['dob'] = data.apply(lambda x: '{}-{}-{}'.format(str(x['by']).zfill(4), str(x['bm']).zfill(2), str(x['bd']).zfill(2)), axis=1)
    data['first_name'] = data.apply(lambda x: x['fname_c1'] if pd.isna(x['fname_c2']) else '{} {}'.format(x['fname_c1'], x['fname_c2']), axis=1)
    data['last_name'] = data.apply(lambda x: x['lname_c1'] if pd.isna(x['lname_c2']) else '{} {}'.format(x['lname_c1'], x['lname_c2']), axis=1)
    data['block'] = data['first_name'].str[0]
    data[['id', 'first_name', 'last_name', 'dob', 'block', 'ent_id']].to_csv('formatted_data.csv', index=False)
    os._exit(0)