'''
This program is where you will store your custom scoring methods.  See readme for further details
'''
import os

def address_comp(x, comp_type='comparison', headers = ''):
    '''
    See if the first characters match as a demo.
    :param x:
    :return:
    '''
    if x[0] is not None and x[1] is not None:
        if x[0]==x[1]:
            if comp_type=='comparison':
                return 1
            else:
                return 2
        else:
            return 0
    else:
        return -1


if __name__=='__main__':
    os.exit(0)